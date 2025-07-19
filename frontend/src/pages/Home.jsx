import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Session } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight,
  Sparkles
} from 'lucide-react';

import ModePicker from '../components/home/ModePicker';
import CommandInput from '../components/home/CommandInput';
import { 
  addMessageToHistory, 
  saveCurrentSession, 
  clearConversationHistory,
  cacheSession 
} from '@/utils/conversationStorage';

export default function Home() {
  const [selectedMode, setSelectedMode] = useState(() => {
    // Restore last selected mode from sessionStorage
    return sessionStorage.getItem('lastSelectedMode') || 'auto';
  });
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Clear conversation history when starting fresh
  useEffect(() => {
    clearConversationHistory();
  }, []);

  // Save selected mode to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('lastSelectedMode', selectedMode);
  }, [selectedMode]);

  const handleSubmit = async (actionType) => {
    if (!instruction.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Add user message to conversation history
      const userMessage = addMessageToHistory({
        type: 'user',
        content: instruction,
        droid_type: selectedMode,
        metadata: { action_type: actionType }
      });

      // Create new session with proper data structure
      const sessionData = {
        title: instruction.slice(0, 50) + (instruction.length > 50 ? '...' : ''),
        description: `${selectedMode} session`,
        instruction: instruction,
        droid_type: selectedMode,
        status: 'running',
        context_entity: '', // Will be populated based on the query
        is_pinned: false,
        messages: [userMessage],
        timeline: [],
        artifacts: [],
        data: {
          mode: selectedMode,
          original_query: instruction,
          created_at: new Date().toISOString()
        }
      };

      console.log('[DEBUG] Creating session with data:', sessionData);
      console.log('[DEBUG] Selected mode:', selectedMode);

      // Create session in backend
      const session = await Session.create(sessionData);
      
      console.log('[DEBUG] Session created:', session);
      console.log('[DEBUG] Session droid_type:', session.droid_type);
      
      // Save session to current session storage
      saveCurrentSession(session);
      
      // Cache the session
      cacheSession(session.id, session);

      // Navigate to session workspace
      navigate(createPageUrl(`Session?id=${session.id}`));
      
    } catch (error) {
      console.error('Error creating session:', error);
      
      // Add error message to conversation history
      addMessageToHistory({
        type: 'system',
        content: `Error creating session: ${error.message}`,
        metadata: { event: 'error', error: error.message }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full relative overflow-y-auto bg-black">
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Hero Section */}
        <div className="text-center mb-12 py-16">
          
          <h1 className="text-heading-1 mb-6 text-white" style={{ fontSize: '48px', lineHeight: '1.1' }}>
            Delegate to AI Assistants
          </h1>
          
          <p className="text-body-large max-w-3xl mx-auto mb-8" style={{ fontSize: '20px', lineHeight: '1.6' }}>
            Transform your sales operations with specialized AI agents that handle research, 
            CRM ops, deal analysis, communications, and forecasting.
          </p>
        </div>

        {/* Mode Picker */}
        <ModePicker selectedMode={selectedMode} onModeSelect={setSelectedMode} />

        {/* Command Input */}
        <CommandInput
          selectedMode={selectedMode}
          instruction={instruction}
          onInstructionChange={setInstruction}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}