// Conversation storage utilities for managing session data

const STORAGE_KEYS = {
  CURRENT_SESSION: 'eragon_current_session',
  SESSION_CACHE: 'eragon_session_cache',
  CONVERSATION_HISTORY: 'eragon_conversation_history'
};

// Add a message to the conversation history
export function addMessageToHistory(message) {
  try {
    const history = getConversationHistory();
    const enhancedMessage = {
      ...message,
      id: message.id || `msg-${Date.now()}`,
      timestamp: message.timestamp || new Date().toISOString()
    };
    
    const updatedHistory = [...history, enhancedMessage];
    // Use sessionStorage for conversation history - should be cleared when tab closes
    sessionStorage.setItem(STORAGE_KEYS.CONVERSATION_HISTORY, JSON.stringify(updatedHistory));
    
    return enhancedMessage;
  } catch (error) {
    console.error('Error adding message to history:', error);
    return message;
  }
}

// Get the current conversation history
export function getConversationHistory() {
  try {
    // Use sessionStorage for conversation history
    const stored = sessionStorage.getItem(STORAGE_KEYS.CONVERSATION_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

// Clear conversation history
export function clearConversationHistory() {
  try {
    // Clear from sessionStorage
    sessionStorage.removeItem(STORAGE_KEYS.CONVERSATION_HISTORY);
  } catch (error) {
    console.error('Error clearing conversation history:', error);
  }
}

// Save the current session
export function saveCurrentSession(session) {
  try {
    if (!session) return;
    
    // Store current session in sessionStorage - should be tab-specific
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
    
    // Also add to persistent session cache in localStorage
    if (session.id) {
      cacheSession(session.id, session);
    }
  } catch (error) {
    console.error('Error saving current session:', error);
  }
}

// Get the current session
export function getCurrentSession() {
  try {
    // Get current session from sessionStorage
    const stored = sessionStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
}

// Cache a session by ID (persistent across browser sessions)
export function cacheSession(sessionId, sessionData) {
  try {
    if (!sessionId || !sessionData) return;
    
    // Get existing cache from localStorage (persistent)
    const cache = getSessionCache();
    
    // Update cache with new session data
    cache[sessionId] = {
      ...sessionData,
      cachedAt: new Date().toISOString()
    };
    
    // Store updated cache (limit to 50 most recent sessions)
    const sessionIds = Object.keys(cache);
    if (sessionIds.length > 50) {
      // Sort by cachedAt and keep only the 50 most recent
      const sortedIds = sessionIds.sort((a, b) => {
        const timeA = new Date(cache[a].cachedAt || 0).getTime();
        const timeB = new Date(cache[b].cachedAt || 0).getTime();
        return timeB - timeA;
      });
      
      const recentIds = sortedIds.slice(0, 50);
      const newCache = {};
      recentIds.forEach(id => {
        newCache[id] = cache[id];
      });
      
      // Keep session cache in localStorage for persistence
      localStorage.setItem(STORAGE_KEYS.SESSION_CACHE, JSON.stringify(newCache));
    } else {
      localStorage.setItem(STORAGE_KEYS.SESSION_CACHE, JSON.stringify(cache));
    }
  } catch (error) {
    console.error('Error caching session:', error);
  }
}

// Get a cached session by ID
export function getCachedSession(sessionId) {
  try {
    const cache = getSessionCache();
    return cache[sessionId] || null;
  } catch (error) {
    console.error('Error getting cached session:', error);
    return null;
  }
}

// Get all cached sessions (from persistent localStorage)
export function getSessionCache() {
  try {
    // Session cache stays in localStorage for persistence across browser sessions
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_CACHE);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error getting session cache:', error);
    return {};
  }
}

// Clear all session cache and current session
export function clearSessionCache() {
  try {
    // Clear persistent cache from localStorage
    localStorage.removeItem(STORAGE_KEYS.SESSION_CACHE);
    // Clear current session from sessionStorage
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  } catch (error) {
    console.error('Error clearing session cache:', error);
  }
}

// Clear current session data only (sessionStorage)
export function clearCurrentSessionData() {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.CONVERSATION_HISTORY);
  } catch (error) {
    console.error('Error clearing current session data:', error);
  }
}

// Export storage keys for debugging
export { STORAGE_KEYS };