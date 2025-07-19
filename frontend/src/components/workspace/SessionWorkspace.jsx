import { useState, useEffect, useMemo } from 'react';
import ChatHistory from './ChatHistory';
import Artifacts from './Artifacts';

export default function SessionWorkspace({ 
  session, 
  conversationHistory, 
  onSend, 
  workflowState, 
  isRunning,
  eventHistory,
  toggleEvent
}) {
  const [isArtifactsCollapsed, setIsArtifactsCollapsed] = useState(true);

  // Extract real-time artifacts from eventHistory
  const realtimeArtifacts = useMemo(() => {
    return eventHistory
      .filter(event => event.type === 'artifact')
      .map(event => ({
        title: event.title,
        content: event.content,
        type: event.artifact_type || 'file'
      }));
  }, [eventHistory]);

  // Auto-expand artifacts panel when artifact events are received
  useEffect(() => {
    // Check if there are any artifact events in the eventHistory
    const hasArtifactEvents = eventHistory.some(event => event.type === 'artifact');
    if (hasArtifactEvents) {
      setIsArtifactsCollapsed(false);
    }
  }, [eventHistory]);

  // Handle artifact click to view in artifacts panel
  const handleArtifactClick = (artifact) => {
    console.log('Artifact clicked:', artifact);
    // Expand the artifacts panel when an artifact is clicked
    setIsArtifactsCollapsed(false);
  };

  const handleCloseArtifacts = () => {
    setIsArtifactsCollapsed(true);
  };

  return (
    // Use two equal-height rows in single-column mode so that each panel can
    // grow/shrink independently and expose its own scrollbar. The `min-h-0`
    // ensures that the children can shrink and allow their internal
    // scrollable areas (`overflow-y-auto`) to take effect.
    <div
      className={`grid h-full bg-black gap-4 p-4
        ${isArtifactsCollapsed ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}
        ${!isArtifactsCollapsed ? 'grid-rows-2 lg:grid-rows-1' : ''}`}
    >
      {/* Chat History - Left Panel */}
      <div className="h-full min-h-0">
        <ChatHistory
          session={session}
          conversationHistory={conversationHistory}
          onSend={onSend}
          workflowState={workflowState}
          isRunning={isRunning}
          eventHistory={eventHistory}
          toggleEvent={toggleEvent}
          onArtifactClick={handleArtifactClick}
          className="h-full"
        />
      </div>

      {/* Artifacts - Right Panel */}
      {!isArtifactsCollapsed && (
        <div className="h-full min-h-0">
          <Artifacts
            session={session}
            realtimeArtifacts={realtimeArtifacts}
            className="h-full"
            onClose={handleCloseArtifacts}
          />
        </div>
      )}
    </div>
  );
}