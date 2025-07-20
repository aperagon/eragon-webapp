import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agno.agent import Agent
from agno.tools.reasoning import ReasoningTools
from agno.storage.sqlite import SqliteStorage
from utils import query_salesforce_sync
from agno.models.anthropic import Claude
from typing import Dict, Optional, AsyncIterator, Any
from datetime import datetime
from dataclasses import asdict
from config.agents import AGENT_INSTRUCTIONS, COMMON_AGENT_SETTINGS
import anthropic
from agno.reasoning.step import NextAction

TOOL_NAME_TO_UI_NAME = {
    "query_salesforce_sync": "Queried Salesforce",
    "web_search": "Searched the web",
    "analyze": "Analyzed the data"
}


async def get_account_intel(account: Optional[str], query: str, session_id: str) -> AsyncIterator[Dict[str, Any]]:
    """Stream account intelligence events in a UI-friendly format.
    
    The function translates agent events into semantic events for the frontend:
    
    1. ``reasoning_started`` / ``reasoning_step`` / ``reasoning_completed`` –
       drive the *Thinking…* collapsible widget.
    2. ``tool_called``                               – surface tool invocations.
    3. ``content_chunk``                             – incremental natural-language output.
    4. ``artifact``                                  – the full response once the run finishes.
    5. ``run_completed``                             – marks the very end of the run.
    
    Args:
        account: The account name to gather intelligence on (optional)
        query: The specific query or request about the account
        session_id: The session ID to associate with this agent run (optional)
        
    Yields:
        Dict[str, Any]: Streaming events for the frontend
    """
    if not session_id:
        yield {
            "type": "error",
            "error": "Session ID is required"
        }
        return
    
    input_query = f"Gather intel on {account or 'the specified account'} for {query}"
    
    # Emit workflow started event
    yield {
        "type": "workflow_started", 
        "mode": "account_intel",
        "workflow_name": "Account Intelligence",
        "timestamp": datetime.now().isoformat()
    }
    
    # Configure agent with session-specific storage if session_id provided
    session_agent = Agent(
        name="Account Intelligence Agent",
        model=Claude(id=COMMON_AGENT_SETTINGS["model_id"]),
        description=AGENT_INSTRUCTIONS["account_intel"]["description"],
        instructions=AGENT_INSTRUCTIONS["account_intel"]["instructions"],
        tools=[
            ReasoningTools(add_instructions=True),
            {
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": 5
            },
            query_salesforce_sync
        ],
        storage=SqliteStorage(
            table_name=f"session_{session_id}", 
            db_file=COMMON_AGENT_SETTINGS["storage_db"]
        ),
        add_history_to_messages=COMMON_AGENT_SETTINGS["add_history_to_messages"],
        add_datetime_to_instructions=COMMON_AGENT_SETTINGS["add_datetime_to_instructions"],
        show_tool_calls=COMMON_AGENT_SETTINGS["show_tool_calls"],
        markdown=True
    )
    
    # Run agent with streaming
    response_stream = await session_agent.arun(
        input_query,
        stream=True,
        add_datetime_to_instructions=True,
        show_tool_calls=True,
        markdown=True,
        show_full_reasoning=True,
        stream_intermediate_steps=True,
    )
    
    # Track response content
    response_content = ""
    reasoning_content = ""
    is_reasoning = False
    next_action = NextAction.CONTINUE
    
    async for event in response_stream:
        event_data = asdict(event)
        event_type = event_data.get("event", "")
        
        # Handle reasoning events
        if event_type == "ReasoningStarted":
            is_reasoning = True
            yield {
                "type": "agent_thinking",
                "content": "Starting to think...",
                "timestamp": datetime.now().isoformat()
            }
            continue
            
        if event_type == "ReasoningStep":
            if is_reasoning:
                # Extract content from ReasoningStep event
                step_content = event_data.get("content", "")
                reasoning_text = step_content.reasoning
                reasoning_content += reasoning_text
                next_action = step_content.next_action
                # Stream reasoning steps immediately as content chunks
                if reasoning_text:
                    yield {
                        "type": "content_chunk",
                        "content": reasoning_text,
                        "timestamp": datetime.now().isoformat(),
                        "next_action": next_action.value
                    }
                    response_content += reasoning_text + "\n\n"
            continue
            
        if event_type == "ReasoningCompleted":
            is_reasoning = False
            yield {
                "type": "reasoning_completed",
                "timestamp": datetime.now().isoformat()
            }
            continue
            
        # Handle tool call events
        if event_type == "ToolCallStarted":
            # Extract tool info from the event data
            tool_data = event_data.get("tool", {})
            tool_name = tool_data.get("tool_name", "") if isinstance(tool_data, dict) else ""
            
            # Skip the "think" tool as it's already handled by reasoning events
            if tool_name and tool_name != "think":
                yield {
                    "type": "tool_called",
                    "tool": TOOL_NAME_TO_UI_NAME[tool_name],
                    "timestamp": datetime.now().isoformat()
                }
            continue
            
        if event_type == "ToolCallCompleted":
            tool_data = event_data.get("tool", {})
            tool_name = tool_data.get("tool_name", "")
            tool_args = event_data.get("tool_args", "")
            title = tool_data.get("title", "")
            result = tool_data.get("result", "")
            
            # Skip the "think" tool as it's already handled by reasoning events
            if tool_name and tool_name != "think":
                            yield {
                "type": "tool_completed",
                "tool": TOOL_NAME_TO_UI_NAME[tool_name],
                "title": title,
                "output": result
            }
            continue

        # Handle RunResponseEvent with reasoning steps
        if event_type == "RunResponseContent":
            # Extract reasoning steps from the extra_data
            continue
            
        # Handle run completion
        if event_type == "RunCompleted":
            # Get content from event data or use accumulated response_content
            content = event_data.get('content', '') or response_content
            
            # Generate title from content using Claude
            if content:
                try:
                    client = anthropic.Anthropic()
                    title_response = client.messages.create(
                        model=COMMON_AGENT_SETTINGS["model_id"],
                        max_tokens=100,
                        messages=[{
                            "role": "user",
                            "content": f"Generate a concise title(5-10 words) for this account intelligence report. Only return the title, nothing else:\n\n{content[:1000]}"
                        }]
                    )
                    title = title_response.content[0].text.strip()
                except Exception as e:
                    print(f"Error generating title: {e}")
                    title = "Account Intelligence Report"
                
                yield {
                    "type": "artifact",
                    "artifact": {
                        "title": title,
                        "content": content
                    },
                    "timestamp": datetime.now().isoformat()
                }

            
            # Emit workflow completed
            yield {
                "type": "workflow_completed",
                "timestamp": datetime.now().isoformat()
            }
            
            yield {"type": "run_completed"}
            break