

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  PanelLeft,
  Search,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Pin,
  Star,
  Clock,
  Bot,
  Building,
  TrendingUp,
  Mail,
  BarChart3,
  Database,
  Zap,
  Home,
  LogOut,
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Session } from "@/api/entities";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ShareSessionModal from "@/components/ShareSessionModal";

const assistantIcons = {
  auto: Zap,
  account_intel: Building,
  crm: Database,
  deal_insight: TrendingUp,
  comms: Mail,
  forecast: BarChart3
};

const statusColors = {
  running: "bg-indigo-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
  needs_input: "bg-yellow-500"
};

// Helper function to map droid_type to display names
const getModeDisplayName = (droidType) => {
  const modeNames = {
    'auto': 'Auto Mode',
    'account_intel': 'Account Intel',
    'crm': 'CRM',
    'deal_insight': 'Deal Insights',
    'comms': 'Communications',
    'forecast': 'Sales Forecast'
  };
  // Default to 'auto' if droidType is null/undefined
  return modeNames[droidType || 'auto'] || 'Auto Mode';
};

export default function Layout({ children, currentPageName, onSessionsUpdate }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const activeSessionId = urlParams.get('id');
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Reload sessions when activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      // Check if the active session exists in current sessions list
      const sessionExists = sessions.some(s => s.id === activeSessionId);
      if (!sessionExists) {
        // Reload sessions if the active session is not in the list
        loadSessions();
      }
    }
  }, [activeSessionId]);

  const loadSessions = async () => {
    const sessionData = await Session.list('-updated_date', 50);
    setSessions(sessionData);
  };

  const filteredSessions = sessions.filter(session =>
    (session.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (session.context_entity?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const pinnedSessions = filteredSessions.filter(s => s.is_pinned);
  const recentSessions = filteredSessions.filter(s => !s.is_pinned);

  return (
    <div className="h-screen bg-white dark:bg-black text-gray-900 dark:text-white overflow-hidden font-inter">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --primary-bg: #ffffff;
          --secondary-bg: #f9fafb;
          --primary-bg-dark: #000000;
          --secondary-bg-dark: #1a1a1a;
          --accent-indigo: #6366f1;
          --text-primary: #ffffff;
          --text-secondary: #e0e0e0;
          --text-muted: #cccccc;
          --border-color: #333333;
        }

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
        }

        .font-inter {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Typography Scale */
        .text-heading-1 {
          font-size: 32px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .text-heading-2 {
          font-size: 24px;
          line-height: 1.3;
          font-weight: 600;
          letter-spacing: -0.015em;
        }

        .text-heading-3 {
          font-size: 18px;
          line-height: 1.4;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .text-heading-4 {
          font-size: 14px;
          line-height: 1.4;
          font-weight: 600;
          letter-spacing: 0.01em;
          text-transform: uppercase;
        }

        .text-body {
          font-size: 14px;
          line-height: 1.6;
          font-weight: 400;
          color: #e0e0e0;
        }

        .text-body-large {
          font-size: 16px;
          line-height: 1.6;
          font-weight: 400;
          color: #e0e0e0;
        }

        .text-caption {
          font-size: 12px;
          line-height: 1.5;
          font-weight: 400;
          color: #cccccc;
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .dark .glass-effect {
          background: rgba(26, 26, 26, 0.8);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--border-color);
        }

        .glow-effect {
          box-shadow: 0 0 25px rgba(99, 102, 241, 0.3);
        }

        .sidebar-item-active {
          background: linear-gradient(to right, rgba(99, 102, 241, 0.25), rgba(99, 102, 241, 0.1));
          border-right: 3px solid var(--accent-indigo);
          box-shadow: inset 0 0 20px rgba(99, 102, 241, 0.2);
          position: relative;
        }
        
        .sidebar-item-active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at left center, rgba(99, 102, 241, 0.15), transparent);
          pointer-events: none;
        }
      `}</style>

      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-black border-r border-[#333333] transition-all duration-300 ease-in-out flex flex-col`}>
          {/* Sidebar Header */}
          <div className="p-4 h-20 flex items-center justify-between border-b border-[#333333]">
              {!sidebarCollapsed && (
                <Link to={createPageUrl("Home")} className="flex items-center">
                  <h2 className="text-heading-2 font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
                    Eragon
                  </h2>
                </Link>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newState = !sidebarCollapsed;
                  setSidebarCollapsed(newState);
                }}
                className="text-gray-600 dark:text-[#cccccc] hover:text-gray-900 dark:hover:text-white bg-transparent border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <PanelLeft className="w-5 h-5" />
              </Button>
          </div>

          {/* New Session Button */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-[#333333]">
              <Link to={createPageUrl("Home")}>
                <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-body transition-all duration-300">
                  <Plus className="w-4 h-4 mr-2" />
                  New Session
                </Button>
              </Link>
            </div>
          )}

          {/* Search */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-[#333333]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-[#cccccc] w-4 h-4" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black border-[#333333] rounded-lg text-white placeholder-[#cccccc] focus:border-indigo-500 text-body"
                />
              </div>
            </div>
          )}

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {sidebarCollapsed ? (
              <div className="p-2 space-y-2 mt-2">
                 <Link to={createPageUrl("Home")} className="block p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333333] transition-colors" title="Home">
                    <Home className="w-6 h-6 text-gray-600 dark:text-[#cccccc] mx-auto" />
                 </Link>
                 <Link to={createPageUrl("Home")} className="block p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333333] transition-colors" title="New Session">
                    <Plus className="w-6 h-6 text-gray-600 dark:text-[#cccccc] mx-auto" />
                 </Link>
                {sessions.slice(0, 8).map((session) => {
                  const AssistantIcon = assistantIcons[session.droid_type || 'auto'] || assistantIcons.auto;
                  return (
                    <Link
                      key={session.id}
                      to={createPageUrl(`Session?id=${session.id}`)}
                      className={`block p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333333] transition-all duration-200 ${activeSessionId === session.id ? 'sidebar-item-active transform scale-[1.05]' : ''}`}
                      title={session.title || 'Untitled Session'}
                    >
                      <AssistantIcon className={`w-6 h-6 ${activeSessionId === session.id ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'text-gray-600 dark:text-[#cccccc]'} mx-auto`} />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {pinnedSessions.length > 0 && (
                  <div>
                    <h3 className="text-heading-4 text-[#cccccc] mb-3 flex items-center">
                      <Pin className="w-3 h-3 mr-2" />
                      Pinned
                    </h3>
                    <div className="space-y-1">
                      {pinnedSessions.map((session) => (
                        <SessionItem 
                          key={session.id} 
                          session={session} 
                          isActive={activeSessionId === session.id}
                          setSessions={setSessions}
                          navigate={navigate}
                          activeSessionId={activeSessionId}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-heading-4 text-[#cccccc] mb-3 flex items-center">
                    <Clock className="w-3 h-3 mr-2" />
                    Recent
                  </h3>
                  <div className="space-y-1">
                    {recentSessions.map((session) => (
                      <SessionItem 
                        key={session.id} 
                        session={session} 
                        isActive={activeSessionId === session.id}
                        setSessions={setSessions}
                        navigate={navigate}
                        activeSessionId={activeSessionId}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Section */}
          <div className="border-t border-[#333333] p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} w-full text-white hover:bg-[#333333] p-3`}>
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-body font-medium text-white truncate">{user?.full_name?.split(' ')[0] || 'User'}</p>
                      <p className="text-caption truncate">{user?.email}</p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-[#1a1a1a] border-[#333333] text-white">
                <DropdownMenuLabel className="font-normal px-3 py-2">
                  <p className="text-body font-medium text-white">{user?.full_name || 'User'}</p>
                  <p className="text-caption truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#333333]" />
                <DropdownMenuItem className="focus:bg-[#333333] focus:text-white hover:bg-[#333333] text-body">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="focus:bg-red-500/10 focus:text-red-400 hover:bg-red-500/10 text-body"
                  onClick={() => logout()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-black">
          {/* Header */}
          <header className="h-20 bg-black border-b border-[#333333] flex items-center justify-between px-8">
            <div className="flex items-center space-x-4">
              {/* Session Details */}
              {currentPageName === 'Session' && activeSessionId && (() => {
                const currentSession = sessions.find(s => s.id === activeSessionId);
                if (!currentSession) return null;
                
                const AssistantIcon = assistantIcons[currentSession.droid_type || 'auto'] || assistantIcons.auto;
                
                return (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                      <AssistantIcon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-white">{currentSession.title || 'Untitled Session'}</h1>
                      <p className="text-sm text-gray-400">{getModeDisplayName(currentSession.droid_type)}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center space-x-4">
              {/* Session Status and Date */}
              {currentPageName === 'Session' && activeSessionId && (() => {
                const currentSession = sessions.find(s => s.id === activeSessionId);
                if (!currentSession) return null;
                
                return (
                  <>
                    <Badge variant="outline" className={`text-caption font-medium ${
                      currentSession.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      currentSession.status === 'running' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                      currentSession.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {currentSession.status?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {new Date(currentSession.created_date).toLocaleDateString()}
                    </span>
                  </>
                );
              })()}
              
              {/* Session Actions */}
              {currentPageName === 'Session' && (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      const currentSession = sessions.find(s => s.id === activeSessionId);
                      if (currentSession) {
                        const newPinned = !currentSession.is_pinned;
                        await Session.update(activeSessionId, { is_pinned: newPinned });
                        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, is_pinned: newPinned } : s));
                      }
                    }}
                    className={`${sessions.find(s => s.id === activeSessionId)?.is_pinned ? 'text-yellow-400 border-yellow-400/30' : 'text-[#cccccc] border-white/20'} hover:text-white bg-transparent hover:bg-white/10`}
                  >
                    <Pin className="w-5 h-5" />
                  </Button>
                  <ShareSessionModal 
                    sessionId={activeSessionId}
                    isOpen={isShareOpen}
                    onOpenChange={setIsShareOpen}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      if (window.confirm('Delete this session?')) {
                        await Session.delete(activeSessionId);
                        setSessions(prev => prev.filter(s => s.id !== activeSessionId));
                        navigate(createPageUrl('Home'));
                      }
                    }}
                    className="text-[#cccccc] hover:text-red-400 bg-transparent border-white/20 hover:bg-red-500/10 hover:border-red-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              )}
              
              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-gray-600 dark:text-[#cccccc] hover:text-gray-900 dark:hover:text-white bg-transparent border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-black">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function SessionItem({ session, isActive, setSessions, navigate, activeSessionId }) {
  const AssistantIcon = assistantIcons[session.droid_type || 'auto'] || assistantIcons.auto;
  const statusColor = statusColors[session.status] || statusColors.running;
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(session.title || 'Untitled Session');

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Delete this session?')) {
      await Session.delete(session.id);
      setSessions(prev => prev.filter(s => s.id !== session.id));
      if (activeSessionId === session.id) {
        navigate(createPageUrl('Home'));
      }
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsEditing(false);
    if (newTitle !== (session.title || 'Untitled Session')) {
      await Session.update(session.id, { title: newTitle });
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, title: newTitle } : s));
    }
  };

  return (
    <Link
      to={createPageUrl(`Session?id=${session.id}`)}
      className={`block p-3 rounded-lg hover:bg-[#333333] transition-all duration-200 group relative ${isActive ? 'sidebar-item-active transform scale-[1.02]' : ''}`}
      onClick={(e) => { if (isEditing) e.preventDefault(); }}
    >
      <div 
        className="flex items-start justify-between"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-[#333333] group-hover:bg-[#404040]'} transition-all duration-200`}>
            <AssistantIcon className={`w-5 h-5 ${isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'text-[#cccccc] group-hover:text-indigo-400'}`} />
          </div>
          <div className="min-w-0 relative">
            {isEditing ? (
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                autoFocus
                className="text-body font-semibold text-white bg-transparent border-b border-indigo-500 focus:outline-none"
              />
            ) : (
              <p className="text-body font-semibold text-white truncate pr-12">{newTitle}</p>
            )}
            <p className="text-caption truncate">{getModeDisplayName(session.droid_type || 'auto')}</p>
            {isHovered && !isEditing && (
              <div className="absolute right-0 top-0 flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 p-0" 
                  onClick={handleEdit}
                >
                  <Pencil className="w-3 h-3 text-gray-400 hover:text-indigo-400" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 p-0" 
                  onClick={handleDelete}
                >
                  <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 opacity-70 group-hover:opacity-100">
          {session.is_pinned && <Pin className="w-3 h-3 text-yellow-500" />}
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor} border-2 border-black`} />
        </div>
      </div>
    </Link>
  );
}

