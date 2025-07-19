import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from '@/components/ProtectedRoute';
import Auth from '@/pages/Auth';
import Home from '@/pages/Home';
import Layout from '@/pages/Layout';
import Session from '@/pages/Session';
import ArtifactView from '@/pages/ArtifactView';
import SharedSessionView from '@/pages/SharedSessionView';
import { AUTH_CONFIG } from '@/config/auth';

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/auth" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Auth />
        } 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout currentPageName="Home">
              <Home />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/session" 
        element={
          <ProtectedRoute>
            <Layout currentPageName="Session">
              <Session />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/artifact" 
        element={
          <ProtectedRoute>
            <ArtifactView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shared-session" 
        element={
          <ProtectedRoute>
            <SharedSessionView />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  // Check if we have a valid Google client ID
  const hasValidGoogleClientId = AUTH_CONFIG.GOOGLE_CLIENT_ID && 
    AUTH_CONFIG.GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

  // Core app content that needs to be wrapped consistently
  const AppContent = () => (
    <Router>
      <AppRoutes />
      <Toaster />
    </Router>
  );

  // Wrapper that ensures proper provider hierarchy
  const AppWithProviders = () => (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );

  // Only wrap with GoogleOAuthProvider if we have a valid client ID
  if (hasValidGoogleClientId) {
    return (
      <GoogleOAuthProvider clientId={AUTH_CONFIG.GOOGLE_CLIENT_ID}>
        <AppWithProviders />
      </GoogleOAuthProvider>
    );
  }

  return <AppWithProviders />;
}

export default App; 