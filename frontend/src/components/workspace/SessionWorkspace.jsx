import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [isChatHistoryCollapsed, setIsChatHistoryCollapsed] = useState(false);
  const artifactsRef = useRef(null);

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

  const handleCloseChatHistory = () => {
    setIsChatHistoryCollapsed(true);
  };

  const handleOpenChatHistory = () => {
    setIsChatHistoryCollapsed(false);
  };

  // Trigger chart resizing when layout changes
  useEffect(() => {
    const resizeCharts = () => {
      if (artifactsRef.current && artifactsRef.current.resizeCharts) {
        // Use a timeout to ensure the layout change is complete
        setTimeout(() => {
          artifactsRef.current.resizeCharts();
        }, 100);
      }
    };

    // Resize charts when layout state changes
    resizeCharts();
  }, [isChatHistoryCollapsed, isArtifactsCollapsed]);

  // Handle window resize events
  useEffect(() => {
    const handleWindowResize = () => {
      if (artifactsRef.current && artifactsRef.current.resizeCharts) {
        // Debounce resize events
        clearTimeout(handleWindowResize.resizeTimeout);
        handleWindowResize.resizeTimeout = setTimeout(() => {
          artifactsRef.current.resizeCharts();
        }, 250);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      clearTimeout(handleWindowResize.resizeTimeout);
    };
  }, []);

  return (
    // Use two equal-height rows in single-column mode so that each panel can
    // grow/shrink independently and expose its own scrollbar. The `min-h-0`
    // ensures that the children can shrink and allow their internal
    // scrollable areas (`overflow-y-auto`) to take effect.
    <div
      className={`grid h-full bg-black gap-4 p-4
        ${isChatHistoryCollapsed ? 'grid-cols-1' : isArtifactsCollapsed ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}
        ${!isArtifactsCollapsed && !isChatHistoryCollapsed ? 'grid-rows-2 lg:grid-rows-1' : ''}`}
    >
      {/* Chat History - Left Panel */}
      {!isChatHistoryCollapsed && (
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
            onClose={handleCloseChatHistory}
            className="h-full"
          />
        </div>
      )}

      {/* Artifacts - Right Panel */}
      {!isArtifactsCollapsed && (
        <div className="h-full min-h-0">
          <Artifacts
            ref={artifactsRef}
            session={session}
            realtimeArtifacts={realtimeArtifacts}
            className="h-full"
            onClose={handleCloseArtifacts}
            onOpenChatHistory={isChatHistoryCollapsed ? handleOpenChatHistory : undefined}
          />
        </div>
      )}

      {/* Show open chat button when chat is collapsed and no artifacts */}
      {isChatHistoryCollapsed && isArtifactsCollapsed && (
        <div className="h-full min-h-0 flex items-center justify-center">
          <button
            onClick={handleOpenChatHistory}
            className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:bg-[#2a2a2a] transition-colors text-white"
          >
            Open Chat History
          </button>
        </div>
      )}
    </div>
  );
}