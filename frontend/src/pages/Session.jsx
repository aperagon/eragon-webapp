
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Session as SessionAPI, AutoDroidWorkflow, CRMWorkflow } from '@/api/entities';
import { cacheSession } from '@/utils/conversationStorage';
import SessionWorkspace from '@/components/workspace/SessionWorkspace';
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Session() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('id');
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventHistory, setEventHistory] = useState([]);
  const [workflowState, setWorkflowState] = useState(null);
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  // Load session data
  useEffect(() => {
    if (!sessionId) {
      navigate(createPageUrl('Home'));
      return;
    }

    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const sessionData = await SessionAPI.get(sessionId);
      setSession(sessionData);
      
      // Cache the session
      cacheSession(sessionId, sessionData);
      
      // Initialize conversation history from messages
      if (sessionData.messages && Array.isArray(sessionData.messages)) {
        setConversationHistory(sessionData.messages);
      }
      
      // Restore event history if available
      if (sessionData.event_history && Array.isArray(sessionData.event_history)) {
        const restoredEvents = sessionData.event_history.map((event, index) => ({
          ...event,
          id: event.id || `restored-${index}`,
          isExpanded: false
        }));
        setEventHistory(restoredEvents);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const runWorkflow = useCallback(async (query) => {
    if (!session) return;

    setIsSessionRunning(true);
    setWorkflowState({ status: 'running', mode: session.droid_type });

    // Clear previous events for new query
    setEventHistory([]);

    // Accumulate events for persistence
    const accumulatedEvents = [];
    let assistantMessageId = null;
    let assistantContent = '';

    try {
      // Choose workflow based on droid_type
      const WorkflowFunction = session.droid_type === 'crm' ? CRMWorkflow : AutoDroidWorkflow;

      // Support workflows that return either `artifact` (single) or `artifacts` (array)
      const {
        artifacts: workflowArtifacts,
        artifact: singleArtifact,
        timeline = []
      } = await WorkflowFunction({
        query,
        session_id: sessionId,
        droid_type: session.droid_type,
        callbacks: {
          onContentChunk: (chunk) => {
            if (!assistantMessageId) {
              assistantMessageId = `assistant-${Date.now()}`;
              const newMessage = {
                id: assistantMessageId,
                type: 'assistant',
                content: '',
                timestamp: new Date().toISOString()
              };
              setConversationHistory(prev => [...prev, newMessage]);
            }

            assistantContent += chunk;

            setConversationHistory(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: assistantContent }
                  : msg
              )
            );

            // Add content chunk event
            const chunkEvent = {
              id: `chunk-${Date.now()}`,
              type: 'content_chunk',
              content: chunk,
              timestamp: new Date().toISOString()
            };
            setEventHistory(prev => [...prev, chunkEvent]);
            accumulatedEvents.push(chunkEvent);
          },
          onArtifact: (artifact) => {
            // Handle artifact creation
            const artifactEvent = {
              id: `artifact-${Date.now()}`,
              type: 'artifact',
              title: artifact.title,
              content: artifact.content,
              artifact_type: artifact.type,
              timestamp: new Date().toISOString()
            };
            setEventHistory(prev => [...prev, artifactEvent]);
            accumulatedEvents.push(artifactEvent);

            // Update session artifacts
            setSession(prev => ({
              ...(prev || {}),
              artifacts: [...((prev?.artifacts) || []), artifact]
            }));
          },
          onToolCall: (tool) => {
            // Normalize backend payload keys
            const toolName = tool.tool || tool.name || tool.tool_name || tool.type || 'unknown';
            const toolType = tool.tool_type || tool.type || 'default';

            const toolEvent = {
              id: `tool-${Date.now()}`,
              type: 'toolCall',
              name: toolName,
              toolType: toolType,
              input: tool.input || tool.tool_args,
              output: tool.output, // may be undefined until completed
              status: 'running',
              timestamp: new Date().toISOString(),
              isExpanded: false
            };
            setEventHistory(prev => [...prev, toolEvent]);
            accumulatedEvents.push(toolEvent);
          },
          // When the tool finishes, update the existing event with output + status
          onToolCompleted: (tool) => {
            const toolName = tool.tool || tool.name || tool.tool_name || tool.type || 'unknown';
            const output = tool.output || tool.result || tool.response;

            setEventHistory(prev => {
              const updated = prev.map(ev => {
                if (ev.type === 'toolCall' && ev.name === toolName && ev.status === 'running') {
                  return { ...ev, output, status: 'completed' };
                }
                return ev;
              });
              return updated;
            });

            const completionEvent = {
              id: `tool-${Date.now()}`,
              type: 'toolCall',
              name: toolName,
              toolType: tool.tool_type || tool.type || 'default',
              output,
              status: 'completed',
              timestamp: new Date().toISOString(),
              isExpanded: false
            };
            accumulatedEvents.push(completionEvent);
            assistantMessageId = null;
            assistantContent = '';
          },
          onStepStarted: (step) => {
            // Update timeline
            setSession(prev => ({
              ...(prev || {}),
              timeline: [...((prev?.timeline) || []), step]
            }));
          },
          onStepCompleted: (step) => {
            // Update timeline
            setSession(prev => ({
              ...(prev || {}),
              timeline: prev?.timeline?.map(s =>
                s.step === step.step ? { ...s, status: 'completed' } : s
              ) || []
            }));
          },
          onCompleted: () => {
            setWorkflowState({ status: 'completed', mode: session.droid_type });
          }
        }
      });

      // Consolidate artifacts from the workflow result (handles both singular & array forms)
      const newArtifacts = Array.isArray(workflowArtifacts)
        ? workflowArtifacts
        : singleArtifact
          ? [singleArtifact]
          : [];

      // Update session with new data
      // Use a callback to get the latest conversation history
      setConversationHistory(prev => {
        const updatedMessages = [...prev];
        
        // Persist event history and messages
        const updateData = {
          messages: updatedMessages,
          artifacts: [...(session.artifacts || []), ...newArtifacts],
          timeline,
          event_history: accumulatedEvents,
          status: 'completed'
        };

        // Update session asynchronously
        SessionAPI.update(sessionId, updateData).then(() => {
          // Update local state after successful persist
          setSession(currentSession => ({ ...(currentSession || {}), ...updateData }));
        });

        return updatedMessages;
      });

    } catch (error) {
      console.error('Error running workflow:', error);
      setWorkflowState({ status: 'failed', mode: session.droid_type });

      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      
      // Use callback to get latest state and update
      setConversationHistory(prev => {
        const updatedMessages = [...prev, errorMessage];
        
        const updateData = {
          messages: updatedMessages,
          status: 'failed'
        };

        // Update session asynchronously
        SessionAPI.update(sessionId, updateData).then(() => {
          setSession(currentSession => ({ ...(currentSession || {}), ...updateData }));
        });

        return updatedMessages;
      });

    } finally {
      setIsSessionRunning(false);
    }
  }, [session, sessionId]);

  const handleSend = useCallback(async (message) => {
    if (!session || isSessionRunning) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setConversationHistory(prev => [...prev, userMessage]);

    await runWorkflow(message);
  }, [session, isSessionRunning, runWorkflow]);

  // Toggle event expansion
  const toggleEvent = useCallback((eventId) => {
    setEventHistory(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, isExpanded: !event.isExpanded }
          : event
      )
    );
  }, []);

  useEffect(() => {
    if (session && session.status === 'running' && conversationHistory.length === 1 && conversationHistory[0].type === 'user' && !isSessionRunning) {
      runWorkflow(conversationHistory[0].content);
    }
  }, [session, conversationHistory, isSessionRunning, runWorkflow]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="text-white">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <SessionWorkspace
      session={session}
      conversationHistory={conversationHistory}
      onSend={handleSend}
      workflowState={workflowState}
      isRunning={isSessionRunning}
      eventHistory={eventHistory}
      toggleEvent={toggleEvent}
    />
  );
}