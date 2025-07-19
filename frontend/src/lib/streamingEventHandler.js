/**
 * Stream NDJSON response from the backend /accounts/intel endpoint and forward
 * the parsed events to consumer-provided callback hooks.
 *
 * Usage example:
 *
 * ```js
 * import { streamResponse } from '@/lib/streamingEventHandler';
 *
 * streamResponse({ account, query }, {
 *   onReasoningStart: () => setIsThinking(true),
 *   onReasoningStep: (chunk) => appendToThinking(chunk),
 *   onReasoningEnd: () => setIsThinking(false),
 *   onToolCall: (tool) => addToolCall(tool),
 *   onRunResponseStarted: () => setArtifactsLoading(true),
 *   onContentChunk: (chunk) => appendToResponse(chunk),
 *   onArtifact: (artifact) => pushArtifact(artifact),
 *   onCompleted: () => setIsRunning(false)
 * });
 * ```
 *
 * All handlers are optional; omit any you don't care about.
 */
export async function streamResponse(
  params,
  {
    onReasoningStart,
    onReasoningStep,
    onReasoningEnd,
    onToolCall,
    onToolCompleted,
    onStepStarted,
    onStepCompleted,
    onRunResponseStarted,
    onArtifact,
    onCompleted,
    onWorkflowMessage,
    onContentChunk,
    onWorkflowStarted,
    onWorkflowCompleted,
  } = {}
) {
  const { account = null, query, session_id = null } = params;

  // Resolve base URL from environment the same way other API helpers do
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
  const url = `${API_BASE_URL}/api/accounts/intel`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
    },
    body: JSON.stringify({ account, query, session_id }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to start stream – status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep the last (possibly incomplete) line

    for (const line of lines) {
      if (!line.trim()) continue; // Skip empty lines
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        // Malformed JSON – skip
        continue;
      }
      dispatchEvent(event);
    }
  }

  // Flush any trailing buffered content (in case the server didn't end with a newline)
  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer);
      dispatchEvent(event);
    } catch {
      /* ignore */
    }
  }

  function dispatchEvent(evt) {
    switch (evt.type) {
      // Thinking/reasoning events
      case 'agent_thinking':
        onReasoningStart?.();
        break;
      case 'reasoning_step':
        onReasoningStep?.(evt);
        break;
      case 'reasoning_completed':
        onReasoningEnd?.();
        break;
      // Tool events
      case 'tool_called':
        onToolCall?.(evt);
        break;
      case 'tool_completed':
        // Pass through tool_completed events to the onToolCompleted callback
        onToolCompleted?.(evt);
        break;
      // Run response indicates artifact generation started
      case 'run_response':
        onRunResponseStarted?.();
        break;
      // Artifact with title and content
      case 'artifact':
        onArtifact?.(evt.artifact);
        break;
      // Workflow events
      case 'workflow_started':
        onWorkflowStarted?.(evt);
        break;
      case 'workflow_completed':
        onWorkflowCompleted?.(evt);
        onCompleted?.();
        break;
      // Workflow messages for chat history
      case 'workflow_message':
        onWorkflowMessage?.(evt);
        break;
      // Content chunks for streaming responses
      case 'content_chunk':
        onContentChunk?.(evt.content);
        break;
      // Legacy events for backward compatibility
      case 'step_started':
        onStepStarted?.(evt.step_name, evt);
        break;
      case 'step_completed':
        onStepCompleted?.(evt.step_name, evt);
        break;
      default:
        // Unsupported / unknown – ignore silently
        break;
    }
  }
}

/**
 * Stream NDJSON response from the backend /crm/workflow endpoint and forward
 * the parsed events to consumer-provided callback hooks.
 *
 * Similar to streamResponse but for CRM workflow operations.
 */
export async function streamCRMResponse(
  params,
  {
    onReasoningStart,
    onReasoningStep,
    onReasoningEnd,
    onToolCall,
    onToolCompleted,
    onStepStarted,
    onStepCompleted,
    onRunResponseStarted,
    onArtifact,
    onCompleted,
    onWorkflowMessage,
    onContentChunk,
    onTeamMessage,
    onAgentStarted,
    onAgentMessage,
    onAgentCompleted,
    onToolCalled,
    onArtifactCreated,
    onFinalResponse,
    onWorkflowStarted,
    onWorkflowCompleted,
  } = {}
) {
  const { query, session_id = null } = params;

  // Resolve base URL from environment the same way other API helpers do
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
  const url = `${API_BASE_URL}/api/crm/workflow`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
    },
    body: JSON.stringify({ query, session_id }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to start stream – status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep the last (possibly incomplete) line

    for (const line of lines) {
      if (!line.trim()) continue; // Skip empty lines
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        // Malformed JSON – skip
        continue;
      }
      dispatchEvent(event);
    }
  }

  // Flush any trailing buffered content (in case the server didn't end with a newline)
  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer);
      dispatchEvent(event);
    } catch {
      /* ignore */
    }
  }

  function dispatchEvent(evt) {
    switch (evt.type) {
      // Workflow events
      case 'workflow_started':
        onWorkflowStarted?.(evt);
        break;
      case 'workflow_completed':
        onWorkflowCompleted?.(evt);
        onCompleted?.();
        break;
      // Thinking/reasoning events
      case 'agent_thinking':
        onReasoningStart?.();
        break;
      case 'reasoning_step':
        onReasoningStep?.(evt);
        break;
      case 'reasoning_completed':
        onReasoningEnd?.();
        break;
      // Team/Agent events
      case 'team_message':
        onTeamMessage?.(evt);
        break;
      case 'agent_started':
        onAgentStarted?.(evt);
        break;
      case 'agent_message':
        onAgentMessage?.(evt);
        break;
      case 'agent_completed':
        onAgentCompleted?.(evt);
        break;
      // Tool events
      case 'tool_called':
        onToolCalled?.(evt);
        onToolCall?.(evt);
        break;
      case 'tool_completed':
        onToolCompleted?.(evt);
        break;
      // Artifact events
      case 'artifact_created':
        onArtifactCreated?.(evt);
        onArtifact?.(evt.artifact);
        break;
      // Final response
      case 'final_response':
        onFinalResponse?.(evt);
        break;
      // Content chunks for streaming responses
      case 'content_chunk':
        onContentChunk?.(evt.content);
        break;
      // Legacy events for backward compatibility
      case 'step_started':
        onStepStarted?.(evt.step_name, evt);
        break;
      case 'step_completed':
        onStepCompleted?.(evt.step_name, evt);
        break;
      default:
        // Unsupported / unknown – ignore silently
        break;
    }
  }
} 