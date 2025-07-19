import React, { createContext, useContext, useReducer, useEffect } from 'react';

import { getAccountNames, getOpportunityNames, getContactNames, getProductNames, getLeadNames } from '../api/entities';
import { SessionStorageService } from '../services/sessionStorageService';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  accountNames: [],
  opportunityNames: [],
  contactNames: [],
  productNames: [],
  leadNames: [],
  entityData: {
    accounts: [],
    opportunities: [],
    contacts: [],
    products: [],
    leads: []
  }
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ACCOUNTS':
      return { ...state, accountNames: action.payload };
    case 'SET_ENTITY_DATA':
      return { 
        ...state, 
        entityData: { ...state.entityData, ...action.payload }
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        
        if (token && user) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: JSON.parse(user),
          });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // Removed the automatic account fetching on authentication
  // This data is now managed by the CommandInput component with session caching

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Mock authentication - replace with your actual API call
      const mockUser = {
        id: '1',
        email: email,
        full_name: email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=6366f1&color=fff`,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store auth data
      localStorage.setItem('authToken', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: mockUser,
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogle = async (credentialResponse) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Decode the JWT token from Google
      const decoded = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      
      // Extract user information from the Google token
      const googleUser = {
        id: decoded.sub,
        email: decoded.email,
        full_name: decoded.name,
        avatar: decoded.picture,
        provider: 'google',
        google_id: decoded.sub,
        email_verified: decoded.email_verified,
      };

      // Here you would typically send this to your backend API
      // For now, we'll store it locally
      const authToken = `google-${decoded.sub}-${Date.now()}`;
      
      // Store auth data
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('user', JSON.stringify(googleUser));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: googleUser,
      });

      return { success: true };
    } catch (error) {
      console.error('Google login failed:', error);
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Google authentication failed. Please try again.',
      });
      return { success: false, error: 'Google authentication failed. Please try again.' };
    }
  };

  const register = async (email, password, fullName) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Mock registration - replace with your actual API call
      const mockUser = {
        id: '3',
        email: email,
        full_name: fullName,
        avatar: `https://ui-avatars.com/api/?name=${fullName}&background=6366f1&color=fff`,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store auth data
      localStorage.setItem('authToken', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: mockUser,
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Clear session storage cache
      SessionStorageService.clearEntityData();
      
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    ...state,
    login,
    loginWithGoogle,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 