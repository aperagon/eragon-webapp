import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ChevronDown,
  ChevronRight,
  Database,
  Globe,
  Bot,
  Zap,
  MessageSquare,
  User,
  Settings,
  Activity,
  Layers,
  Sparkles,
  UserCircle2,
  ChevronUp,
  Brain,
  Code2,
  Terminal,
  FileCode,
  Copy,
  Check,
  Package
} from "lucide-react";
import { getWorkflowConfig } from '@/config/workflowConfigs';
import MarkdownPreview from "@uiw/react-markdown-preview";

const statusIcons = {
  running: Loader2,
  completed: CheckCircle,
  failed: AlertCircle,
  needs_input: Clock
};

const toolIcons = {
  salesforce: Database,
  web_search: Globe,
  llm_inference: Bot,
  scoring: Zap,
  code_execution: Terminal,
  file_operation: FileCode,
  default: Code2
};

const messageTypeIcons = {
  user: UserCircle2,
  assistant: Sparkles,
  system: Settings,
  workflow: Activity,
  agent: Bot
};

const WorkflowUpdate = ({ workflowState, className }) => {
  if (!workflowState || !workflowState.mode || workflowState.status !== 'running') return null;
  
  const config = getWorkflowConfig(workflowState.mode);

  return (
    <div className={`text-xs text-gray-500 flex items-center space-x-2 ${className}`}>
      <Loader2 className="w-3 h-3 animate-spin" />
      <span>Thinking...</span>
    </div>
  );
};

export default function ChatHistory({ session, conversationHistory = [], className, onSend, workflowState, isRunning, isLoading, eventHistory = [], toggleEvent, onArtifactClick }) {
  const [expandedSteps, setExpandedSteps] = React.useState(new Set());
  const [newMessage, setNewMessage] = React.useState("");
  const [copiedId, setCopiedId] = React.useState(null);
  const scrollRef = React.useRef(null);

  const toggleStep = (stepIndex) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepIndex)) {
      newExpanded.delete(stepIndex);
    } else {
      newExpanded.add(stepIndex);
    }
    setExpandedSteps(newExpanded);
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;
    if (onSend) {
      onSend(newMessage.trim());
    }
    setNewMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom when new events are added
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory.length, eventHistory.length]);

  // Combine all events chronologically
  const allEvents = React.useMemo(() => {
    const events = [];
    
    // Deduplicate messages by id (or by content as fallback) to avoid repeated renders
    const seenMessages = new Set();
    conversationHistory.forEach(message => {
      const key = message.id ?? `${message.type}-${message.content}`;
      if (!seenMessages.has(key)) {
        seenMessages.add(key);
        events.push({
          type: 'message',
          timestamp: message.timestamp || new Date().toISOString(),
          data: message
        });
      }
    });
    
    // Add timeline events if session exists
    if (session?.timeline) {
      session.timeline.forEach(step => {
        events.push({
          type: 'timeline',
          timestamp: step.timestamp || new Date().toISOString(),
          data: step
        });
      });
    }
    
    // Add tool call, content chunk, and artifact events
    eventHistory.forEach(event => {
      events.push({
        type: event.type === 'content_chunk' ? 'content_chunk' : 
              event.type === 'artifact' ? 'artifact' : 'toolCall',
        timestamp: event.timestamp || new Date().toISOString(),
        data: event
      });
    });
    
    
    // Sort by timestamp
    return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [conversationHistory, session?.timeline, eventHistory]);

  if (!session && conversationHistory.length === 0) {
    return (
      <Card className={`bg-[#1a1a1a] border-[#333333] ${className}`}>
        <CardHeader className="pb-6">
          <CardTitle className="text-white text-heading-2 flex items-center">
            <MessageSquare className="w-6 h-6 mr-3 text-indigo-400" />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-16 text-[#e0e0e0]">
            <Clock className="w-8 h-8 mr-3 text-[#cccccc]" />
            <div className="text-center">
              <p className="text-body-large font-medium">No chat history available</p>
              <p className="text-caption mt-2 text-[#cccccc]">Messages will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-[#1a1a1a] border-[#333333] flex flex-col h-full ${className}`}>
      <CardHeader className="pb-6 flex-shrink-0">
        <CardTitle className="text-white text-heading-2 flex items-center">
          <MessageSquare className="w-6 h-6 mr-3 text-indigo-400" />
          <span className="text-white">Chat</span>
        </CardTitle>
      </CardHeader>
      {/* Scrollable history */}
      <CardContent className="space-y-4 flex-1 overflow-y-auto pr-2 min-h-0">
        {/* Display all events chronologically */}
        {allEvents.map((event, index) => {
          if (event.type === 'message') {
            const message = event.data;
            const MessageIcon = messageTypeIcons[message.type] || MessageSquare;
            
            return (
              <div key={`message-${message.id}`} className="relative flex justify-start">
                <div className="w-full">
                  {/* Clean message styling similar to Factory.ai - increased size */}
                  <div className={`flex items-start space-x-4 py-3 ${message.type === 'user' ? 'pl-0' : 'pl-0'}`}>
                    <div className={`w-8 h-8 rounded-full ${message.type === 'user' ? 'bg-blue-600' : 'bg-gray-600'} flex items-center justify-center flex-shrink-0`}>
                      <MessageIcon className={`w-5 h-5 ${message.type === 'user' ? 'text-white' : 'text-gray-200'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`${message.type === 'user' ? 'text-white font-medium' : 'text-gray-100'} text-base leading-relaxed`}>
                        <MarkdownPreview
                          source={message.content}
                          style={{ 
                            background: 'transparent', 
                            color: message.type === 'user' ? '#ffffff' : '#f3f4f6',
                            fontSize: '1rem',
                            fontWeight: message.type === 'user' ? '500' : '400'
                          }}
                          className="markdown-preview-message"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else if (event.type === 'timeline') {
            const step = event.data;
            const StatusIcon = statusIcons[step.status];
            const isExpanded = expandedSteps.has(index);
            
            return (
              <div key={`timeline-${index}`} className="mb-2">
                {/* Tool call styling with shadow and distinct background - decreased size */}
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a] shadow-lg shadow-black/20">
                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleStep(index)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <StatusIcon className={`w-3 h-3 text-indigo-400 ${step.status === 'running' ? 'animate-spin' : ''}`} />
                      </div>
                      <span className="text-white text-xs font-medium">{step.step}</span>
                      {step.tool_calls && step.tool_calls.length > 0 && (
                        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ml-auto ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                    
                    {isExpanded && step.tool_calls && step.tool_calls.length > 0 && (
                      <div className="mt-2 ml-8 space-y-1">
                        {step.tool_calls.map((tool, toolIndex) => {
                          const ToolIcon = toolIcons[tool.type] || Zap;
                          return (
                            <div key={toolIndex} className="flex items-center space-x-2 text-xs">
                              <ToolIcon className="w-2 h-2 text-indigo-400" />
                              <span className="text-gray-300">{tool.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          } else if (event.type === 'toolCall') {
            const ev = event.data;
            const EventIcon = toolIcons[ev.toolType] || toolIcons.default;
            
            return (
              <div 
                key={ev.id || `tool-${index}`} 
                className="mb-2"
              >
                {/* Enhanced tool call styling with more prominent shadow and styling - decreased size */}
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a] shadow-lg shadow-black/30 hover:shadow-black/40 transition-shadow">
                  <div 
                    className="cursor-pointer" 
                    onClick={() => toggleEvent(ev.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <EventIcon className="w-3 h-3 text-indigo-400" />
                      </div>
                      <span className="text-white text-xs font-medium">
                        {ev.name?.toUpperCase() || 'UNKNOWN'}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ml-auto ${ev.isExpanded ? 'rotate-180' : ''}`} />
                      {ev.status === 'completed' && (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      )}
                      {ev.status === 'failed' && (
                        <AlertCircle className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                    {ev.isExpanded && (
                      <div className="mt-2 ml-8">
                        {ev.output && (
                          <div className="mt-1">
                            <MarkdownPreview
                              source={ev.output}
                              style={{ 
                                background: 'transparent', 
                                color: '#9ca3af',
                                fontSize: '0.75rem'
                              }}
                              className="markdown-preview-tool-output"
                              components={{
                                table: ({ children, ...props }) => (
                                  <div style={{ 
                                    overflowX: 'auto', 
                                    marginTop: '0.5rem', 
                                    marginBottom: '0.5rem',
                                    backgroundColor: '#0a0a0a',
                                    border: '1px solid #333333',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem'
                                  }}>
                                    <table 
                                      {...props} 
                                      style={{
                                        borderCollapse: 'collapse',
                                        width: '100%',
                                        minWidth: 'max-content',
                                        fontSize: '0.7rem',
                                        backgroundColor: 'transparent'
                                      }}
                                    >
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children, ...props }) => (
                                  <thead 
                                    {...props} 
                                    style={{
                                      backgroundColor: 'rgba(75, 85, 99, 0.1)',
                                      borderBottom: '1px solid #374151'
                                    }}
                                  >
                                    {children}
                                  </thead>
                                ),
                                tbody: ({ children, ...props }) => (
                                  <tbody {...props}>
                                    {children}
                                  </tbody>
                                ),
                                tr: ({ children, ...props }) => (
                                  <tr 
                                    {...props} 
                                    style={{
                                      borderBottom: '1px solid #374151'
                                    }}
                                  >
                                    {children}
                                  </tr>
                                ),
                                th: ({ children, ...props }) => (
                                  <th 
                                    {...props} 
                                    style={{
                                      padding: '0.4rem',
                                      textAlign: 'left',
                                      fontWeight: '600',
                                      color: '#e5e7eb',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {children}
                                  </th>
                                ),
                                td: ({ children, ...props }) => (
                                  <td 
                                    {...props} 
                                    style={{
                                      padding: '0.4rem',
                                      color: '#9ca3af',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {children}
                                  </td>
                                )
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          } else if (event.type === 'artifact') {
            const artifact = event.data;
            
            return (
              <div 
                key={artifact.id || `artifact-${index}`} 
                className="relative flex justify-start cursor-pointer hover:bg-[#1f1f1f] rounded-lg transition-colors"
                onClick={() => onArtifactClick && onArtifactClick(artifact)}
              >
                <div className="w-full">
                  {/* Artifact event styling - shows only the title */}
                  <div className="flex items-start space-x-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-indigo-400 text-base leading-relaxed font-medium hover:text-indigo-300 transition-colors">
                        📄 {artifact.title}
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        })}



        {/* Show loading state */}
        {allEvents.length === 0 && isLoading && (
          <div className="flex items-center justify-center py-16 text-[#e0e0e0]">
            <Loader2 className="w-8 h-8 mr-3 text-[#cccccc] animate-spin" />
            <div className="text-center">
              <p className="text-body-large font-medium">Loading conversation...</p>
              <p className="text-caption mt-2 text-[#cccccc]">Messages will appear here</p>
            </div>
          </div>
        )}

        {/* Show empty state if no events and not loading */}
        {allEvents.length === 0 && !isLoading && !isRunning && (
          <div className="flex items-center justify-center py-16 text-[#e0e0e0]">
            <div className="text-center">
              <p className="text-body-large font-medium">No messages yet</p>
              <p className="text-caption mt-2 text-[#cccccc]">Start a conversation to see messages here</p>
            </div>
          </div>
        )}
        
        {/* Show workflow update if running */}
        {isRunning && workflowState && workflowState.status === 'running' && (
          <WorkflowUpdate workflowState={workflowState} className="mt-4" />
        )}
        
        {/* Scroll anchor */}
        <div ref={scrollRef} />
      </CardContent>

      {/* Input box fixed at bottom */}
      <div className="border-t border-[#333333] p-4 bg-[#1a1a1a] flex-shrink-0">
        <div className="relative">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Continue the conversation..."
            className="min-h-[2.5rem] bg-transparent border-0 rounded-none text-white placeholder-[#cccccc] focus:ring-0 focus:border-0 resize-none pr-12"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="absolute top-1/2 right-3 -translate-y-1/2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white p-2 rounded-md flex items-center justify-center"
            size="icon"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
} 