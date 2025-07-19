import { API_ENDPOINTS, getRequestOptions, apiCall, API_BASE_URL } from './config';
// Import streaming helpers
import { streamAccountIntelResponse, streamCRMResponse } from '../lib/streamingEventHandler';

// Session Entity
export const Session = {
  async create(data) {
    const url = `${API_ENDPOINTS.SESSIONS}/`;
    const options = getRequestOptions('POST', data);
    return await apiCall(url, options);
  },

  async list(sort = '-updated_date', limit = 50) {
    const url = `${API_ENDPOINTS.SESSIONS}/?sort=${sort}&limit=${limit}`;
    const options = getRequestOptions('GET');
    return await apiCall(url, options);
  },

  async filter(query) {
    const params = new URLSearchParams();
    if (query.id) params.append('id', query.id);
    
    const url = `${API_ENDPOINTS.SESSIONS}/filter/?${params.toString()}`;
    const options = getRequestOptions('GET');
    return await apiCall(url, options);
  },

  async get(id) {
    const url = `${API_ENDPOINTS.SESSIONS}/${id}`;
    const options = getRequestOptions('GET');
    return await apiCall(url, options);
  },

  async update(id, data) {
    const url = `${API_ENDPOINTS.SESSIONS}/${id}`;
    const options = getRequestOptions('PUT', data);
    return await apiCall(url, options);
  },

  async delete(id) {
    const url = `${API_ENDPOINTS.SESSIONS}/${id}`;
    const options = getRequestOptions('DELETE');
    return await apiCall(url, options);
  },

  async sendMessage(sessionId, messageData) {
    const url = `${API_ENDPOINTS.SESSIONS}/${sessionId}/messages`;
    const options = getRequestOptions('POST', messageData);
    return await apiCall(url, options);
  },

  async getMessages(sessionId) {
    const url = `${API_ENDPOINTS.SESSIONS}/${sessionId}/messages`;
    const options = getRequestOptions('GET');
    return await apiCall(url, options);
  },

  async updateShareSettings(sessionId, accessLevel) {
    const url = `${API_ENDPOINTS.SESSIONS}/${sessionId}/share`;
    const options = getRequestOptions('PUT', { access_level: accessLevel });
    return await apiCall(url, options);
  }
};

// Account Entity
export const Account = {
  async list(sort = '-updated_date', limit = 50) {
    const url = `${API_ENDPOINTS.ACCOUNTS}/?sort=${sort}&limit=${limit}`;
    const options = getRequestOptions('GET');
    return await apiCall(url, options);
  },

  async get(id) {
    const url = `${API_ENDPOINTS.ACCOUNTS}/${id}`;
    const options = getRequestOptions('GET');
    return await apiCall(url, options);
  }
};

// Opportunity Entity
export const Opportunity = {
  async list(sort = '-updated_date', limit = 50) {
    const url = `${API_ENDPOINTS.OPPORTUNITIES}/?sort=${sort}&limit=${limit}`;
    const options = getRequestOptions('GET');
    return await apiCall(url, options);
  },

  async get(id) {
    const url = `${API_ENDPOINTS.OPPORTUNITIES}/${id}`;
    const options = getRequestOptions('GET');
    return await apiCall(url, options);
  }
};

// User Entity
export const User = {
  async me() {
    const url = `${API_ENDPOINTS.USERS}/me`;
    const options = getRequestOptions('GET');
    return await apiCall(url, options);
  },

  async updateMe(data) {
    const url = `${API_ENDPOINTS.USERS}/me`;
    const options = getRequestOptions('PUT', data);
    return await apiCall(url, options);
  },

  async logout() {
    const url = `${API_ENDPOINTS.USERS}/logout`;
    const options = getRequestOptions('POST');
    return await apiCall(url, options);
  }
};

export const getAccountNames = async () => {
  const url = `${API_ENDPOINTS.ACCOUNTS}/names`;
  const options = getRequestOptions('GET');
  return await apiCall(url, options);
};

export const getOpportunityNames = async () => {
  const url = `${API_ENDPOINTS.OPPORTUNITIES}/names`;
  const options = getRequestOptions('GET');
  return await apiCall(url, options);
};

export const getContactNames = async () => {
  const url = `${API_BASE_URL}/api/contacts/names`;
  const options = getRequestOptions('GET');
  return await apiCall(url, options);
};

export const getProductNames = async () => {
  const url = `${API_BASE_URL}/api/products/names`;
  const options = getRequestOptions('GET');
  return await apiCall(url, options);
};

export const getLeadNames = async () => {
  const url = `${API_BASE_URL}/api/leads/names`;
  const options = getRequestOptions('GET');
  return await apiCall(url, options);
};

// Account-intel via AGNO team (streams NDJSON). Callbacks are optional and allow
// the caller (e.g. Session page) to react live to events.
//
// AccountIntel({ account, query, session_id, callbacks }) → { artifact, timeline }
export const AccountIntel = async ({ account = null, query, session_id = null, callbacks = {} }) => {
  let artifact = {};
  const timeline = [];

  try {
    // Wrap streaming in a try/catch so consumers receive proper errors
    await streamAccountIntelResponse(
      { account, query, session_id },
      {
        onReasoningStart: callbacks.onReasoningStart,
        onReasoningStep: callbacks.onReasoningStep,
        onReasoningEnd: callbacks.onReasoningEnd,
        onRunResponseStarted: callbacks.onRunResponseStarted,
        onStepStarted: (stepName) => {
          const entry = {
            step: stepName,
            status: 'running',
            timestamp: new Date().toISOString(),
            tool_calls: []
          };
          timeline.push(entry);
          callbacks.onStepStarted?.(entry);
        },
        onStepCompleted: (stepName) => {
          const idx = timeline.findIndex((e) => e.step === stepName && e.status === 'running');
          if (idx !== -1) {
            timeline[idx].status = 'completed';
            timeline[idx].timestamp = new Date().toISOString();
            callbacks.onStepCompleted?.(timeline[idx]);
          }
        },
        onToolCall: (tool) => {
          // Attach tool call to the most recent running step if available
          if (timeline && timeline.length > 0) {
            const runningIdx = [...timeline]
              .reverse()
              .findIndex((e) => e.status === 'running');
            if (runningIdx !== -1) {
              const actualIdx = timeline.length - 1 - runningIdx;
              const t = tool?.type || 'tool';
              const toolCall = { type: t, name: tool?.name || tool?.type || 'tool_call' };
              if (!timeline[actualIdx].tool_calls) timeline[actualIdx].tool_calls = [];
              timeline[actualIdx].tool_calls.push(toolCall);
            }
          }
          callbacks.onToolCall?.(tool);
        },
        // Handle content chunks for streaming responses
        onContentChunk: (chunk) => {
          callbacks.onContentChunk?.(chunk);
        },
        onArtifact: (art) => {
          artifact = art;
          callbacks.onArtifact?.(art);
        },
        onCompleted: () => {
          callbacks.onCompleted?.();
        },
        // Pass through new workflow events
        onWorkflowStarted: callbacks.onWorkflowStarted,
        onPhaseStarted: callbacks.onPhaseStarted,
        onPhaseCompleted: callbacks.onPhaseCompleted,
        onParallelExecutionStarted: callbacks.onParallelExecutionStarted,
        onAgentStarted: callbacks.onAgentStarted,
        onAgentCompleted: callbacks.onAgentCompleted,
        onAgentThinking: callbacks.onAgentThinking,
        onWorkflowCompleted: callbacks.onWorkflowCompleted,
        onToolCompleted: callbacks.onToolCompleted,
        onWorkflowMessage: callbacks.onWorkflowMessage,
      }
    );
  } catch (error) {
    console.error('AccountIntel error:', error);
    throw error;
  }

  return { artifact, timeline };
};

// AutoDroid Workflow - handles auto mode and routes to appropriate workflow
// AutoDroidWorkflow({ query, session_id, droid_type, callbacks }) → { artifacts, timeline }
export const AutoDroidWorkflow = async ({ query, session_id = null, droid_type = 'auto', callbacks = {} }) => {
  // For account_intel mode, use AccountIntel
  if (droid_type === 'account_intel') {
    return AccountIntel({ query, session_id, callbacks });
  }
  
  // For CRM mode, use CRMWorkflow
  if (droid_type === 'crm') {
    return CRMWorkflow({ query, session_id, callbacks });
  }
  
  // For other modes (auto, deal_insight, comms, forecast), use a generic workflow
  // This is a placeholder that can be replaced with actual implementations
  const artifacts = [];
  const timeline = [];
  
  // Simulate a basic workflow for now
  const stepName = `Processing ${droid_type} request`;
  const entry = {
    step: stepName,
    status: 'running',
    timestamp: new Date().toISOString(),
    tool_calls: []
  };
  timeline.push(entry);
  callbacks.onStepStarted?.(entry);
  
  // Simulate some processing
  setTimeout(() => {
    entry.status = 'completed';
    callbacks.onStepCompleted?.(entry);
    
    // Send a response
    callbacks.onContentChunk?.(`This is a simulated response for ${droid_type} mode. The actual implementation will process your query: "${query}"`);
    callbacks.onCompleted?.();
  }, 1000);
  
  return { artifacts, timeline };
};

// CRM Workflow via AGNO team (streams NDJSON). Callbacks are optional and allow
// the caller (e.g. Session page) to react live to events.
//
// CRMWorkflow({ query, session_id, callbacks }) → { artifacts, timeline }
export const CRMWorkflow = async ({ query, session_id = null, callbacks = {} }) => {
  const artifacts = [];
  const timeline = [];

  // Wrap streaming in a try/catch so consumers receive proper errors
  await streamCRMResponse(
    { query, session_id },
    {
      onReasoningStart: callbacks.onReasoningStart,
      onReasoningStep: callbacks.onReasoningStep,
      onReasoningEnd: callbacks.onReasoningEnd,
      onRunResponseStarted: callbacks.onRunResponseStarted,
      onStepStarted: (stepName) => {
        const entry = {
          step: stepName,
          status: 'running',
          timestamp: new Date().toISOString(),
          tool_calls: []
        };
        timeline.push(entry);
        callbacks.onStepStarted?.(entry);
      },
      onStepCompleted: (stepName) => {
        const idx = timeline.findIndex((e) => e.step === stepName && e.status === 'running');
        if (idx !== -1) {
          timeline[idx].status = 'completed';
          timeline[idx].timestamp = new Date().toISOString();
          callbacks.onStepCompleted?.(timeline[idx]);
        }
      },
      onToolCall: (tool) => {
        // Attach tool call to the most recent running step if available
        if (timeline && timeline.length > 0) {
          const runningIdx = [...timeline]
            .reverse()
            .findIndex((e) => e.status === 'running');
          if (runningIdx !== -1) {
            const actualIdx = timeline.length - 1 - runningIdx;
            const t = tool?.type || 'tool';
            const toolCall = { type: t, name: tool?.name || tool?.type || 'tool_call' };
            if (!timeline[actualIdx].tool_calls) timeline[actualIdx].tool_calls = [];
            timeline[actualIdx].tool_calls.push(toolCall);
          }
        }
        callbacks.onToolCall?.(tool);
      },
      // Handle content chunks for streaming responses
      onContentChunk: callbacks.onContentChunk,
      onArtifact: (art) => {
        artifacts.push(art);
        callbacks.onArtifact?.(art);
      },
      onCompleted: callbacks.onCompleted,
      // Pass through new workflow events
      onWorkflowStarted: callbacks.onWorkflowStarted,
      onPhaseStarted: callbacks.onPhaseStarted,
      onPhaseCompleted: callbacks.onPhaseCompleted,
      onParallelExecutionStarted: callbacks.onParallelExecutionStarted,
      onAgentStarted: callbacks.onAgentStarted,
      onAgentCompleted: callbacks.onAgentCompleted,
      onAgentThinking: callbacks.onAgentThinking,
      onWorkflowCompleted: callbacks.onWorkflowCompleted,
      onToolCompleted: callbacks.onToolCompleted,
      onWorkflowMessage: callbacks.onWorkflowMessage,
      // CRM specific events
      onTeamMessage: callbacks.onTeamMessage,
      onAgentMessage: callbacks.onAgentMessage,
      onArtifactCreated: callbacks.onArtifactCreated,
      onFinalResponse: callbacks.onFinalResponse,
    }
  );

  return { artifacts, timeline };
};