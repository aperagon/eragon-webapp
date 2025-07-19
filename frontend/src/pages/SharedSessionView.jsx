import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Session } from '@/api/entities';
import { API_ENDPOINTS } from '@/api/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  AlertCircle,
  Loader2,
  Package,
  Clock,
  Building,
  Zap,
  Database,
  TrendingUp,
  Mail,
  BarChart3
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import ChatHistory from '../components/workspace/ChatHistory';
import Artifacts from '../components/workspace/Artifacts';

const assistantIcons = {
  auto: Zap,
  account_intel: Building,
  crm: Database,
  deal_insight: TrendingUp,
  comms: Mail,
  forecast: BarChart3
};

const getModeDisplayName = (droidType) => {
  const modeNames = {
    'auto': 'Auto Mode',
    'account_intel': 'Account Intel',
    'crm': 'CRM',
    'deal_insight': 'Deal Insights',
    'comms': 'Communications',
    'forecast': 'Sales Forecast'
  };
  return modeNames[droidType || 'auto'] || 'Auto Mode';
};

export default function SharedSessionView() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [eventHistory, setEventHistory] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const sessionId = urlParams.get('id');

  useEffect(() => {
    if (sessionId) {
      loadSession();
    } else {
      setError('No session ID provided');
      setIsLoading(false);
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      // Load session data with access check for shared sessions
      const url = `${API_ENDPOINTS.SESSIONS}/${sessionId}?check_access=true`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('This session is private and cannot be accessed.');
        } else if (response.status === 404) {
          setError('Session not found');
        } else {
          setError('Failed to load session');
        }
        setIsLoading(false);
        return;
      }
      
      const sessionData = await response.json();
      
      if (sessionData) {
        setSession(sessionData);
        
        // Load event history if available
        if (sessionData.event_history) {
          setEventHistory(sessionData.event_history);
        }
        
        // Load messages if available
        try {
          const messages = await Session.getMessages(sessionId);
          if (messages && messages.length > 0) {
            setConversationHistory(messages);
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      } else {
        setError('Session not found');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setError('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEvent = (id) => {
    setEventHistory(prev => prev.map(item =>
      item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading shared session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('Home'))}
            className="mt-4 border-white/20 text-white hover:bg-white/10"
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-400 mb-2">Session Not Found</h2>
          <p className="text-gray-500">The requested session could not be found</p>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('Home'))}
            className="mt-4 border-white/20 text-white hover:bg-white/10"
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const AssistantIcon = assistantIcons[session.droid_type || 'auto'] || assistantIcons.auto;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="h-20 bg-black border-b border-[#333333] flex items-center justify-between px-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('Home'))}
            className="text-[#cccccc] hover:text-white bg-transparent border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <AssistantIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">{session.title || 'Untitled Session'}</h1>
              <p className="text-sm text-gray-400">{getModeDisplayName(session.droid_type)} • Shared Session</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge 
            variant="outline" 
            className={`text-caption font-medium ${
              session.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              session.status === 'running' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
              session.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}
          >
            {session.status?.toUpperCase() || 'UNKNOWN'}
          </Badge>
          <span className="text-sm text-gray-400">
            <Clock className="w-4 h-4 inline mr-1" />
            {new Date(session.created_date).toLocaleDateString()}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
        <div className="w-1/2 p-6 border-r border-[#333333]">
          <ChatHistory 
            session={session} 
            conversationHistory={conversationHistory}
            instruction={session.instruction}
            isThinking={false}
            thinkingContent=""
            currentStep={null}
            workflowState={{
              mode: session.droid_type,
              config: null,
              status: session.status || 'completed',
              currentPhase: null,
              phases: {},
              agents: {},
              startTime: null,
              recentEvents: []
            }}
            isRunning={false}
            isGeneratingArtifacts={false}
            isLoading={false}
            eventHistory={eventHistory}
            toggleEvent={toggleEvent}
            readOnly={true}
          />
        </div>
        <div className="w-1/2 p-6">
          <Artifacts 
            session={session}
            realtimeArtifacts={[]}
            title={session.title || 'Untitled Session'} 
            status={session.status || 'completed'} 
            contextEntity={session.context_entity}
            isGenerating={false}
          />
        </div>
      </div>
    </div>
  );
}