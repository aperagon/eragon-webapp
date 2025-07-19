// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

export const API_ENDPOINTS = {
  // Entity endpoints
  SESSIONS: `${API_BASE_URL}/api/sessions`,
  ACCOUNTS: `${API_BASE_URL}/api/accounts`,
  OPPORTUNITIES: `${API_BASE_URL}/api/opportunities`,
  USERS: `${API_BASE_URL}/api/users`,
  
  // Streaming endpoints
  ACCOUNT_INTEL: `${API_BASE_URL}/api/accounts/intel`,
  CRM_WORKFLOW: `${API_BASE_URL}/api/crm/workflow`,
};

// Common request options
export const getRequestOptions = (method = 'GET', data = null) => {
  const authToken = localStorage.getItem('authToken');
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add auth token if available
  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  return options;
};

// Helper function for API calls
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}; 