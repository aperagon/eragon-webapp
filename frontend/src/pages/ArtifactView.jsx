import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Session } from '@/api/entities';
import { API_ENDPOINTS } from '@/api/config';
import MarkdownPreview from "@uiw/react-markdown-preview";
import { FileText, Download, Share2, Copy, Table, Mail, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

// Actually, since ArtifactCard is inside Artifacts, perhaps copy the function or import if possible.

// For simplicity, I'll recreate a full screen version.

const artifactIcons = {
  table: Table,
  brief: FileText,
  email: Mail,
  chart: BarChart3,
  file: Download
};

const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
};

const getFaviconUrl = (url) => {
  const domain = extractDomain(url);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
};

const ArtifactView = () => {
  const [artifact, setArtifact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const sessionId = urlParams.get('sessionId');
  const artifactIndex = parseInt(urlParams.get('artifactIndex'), 10);

  useEffect(() => {
    if (sessionId && !isNaN(artifactIndex)) {
      loadArtifact();
    }
  }, [sessionId, artifactIndex]);

  const loadArtifact = async () => {
    try {
      console.log('Loading artifact with sessionId:', sessionId, 'artifactIndex:', artifactIndex);
      
      // Load session data with access check for shared artifacts
      const url = `${API_ENDPOINTS.SESSIONS}/${sessionId}?check_access=true`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('This artifact is from a private session and cannot be accessed.');
        } else if (response.status === 404) {
          setError('Session not found');
        } else {
          setError('Failed to load artifact');
        }
        setIsLoading(false);
        return;
      }
      
      const session = await response.json();
      console.log('Session loaded:', session);
      
      if (session && session.artifacts && session.artifacts[artifactIndex]) {
        console.log('Artifact found:', session.artifacts[artifactIndex]);
        setArtifact(session.artifacts[artifactIndex]);
      } else {
        console.error('Artifact not found in session', {
          hasSession: !!session,
          hasArtifacts: !!(session && session.artifacts),
          artifactCount: session?.artifacts?.length || 0,
          requestedIndex: artifactIndex
        });
      }
    } catch (error) {
      console.error('Error loading artifact:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        sessionId,
        artifactIndex
      });
      setError(error.message || 'Failed to load artifact');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading artifact...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Artifact</h2>
          <p className="text-gray-400">{error}</p>
          <p className="text-sm text-gray-500 mt-4">Please check the console for more details</p>
        </div>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-400 mb-2">Artifact Not Found</h2>
          <p className="text-gray-500">The requested artifact could not be found</p>
        </div>
      </div>
    );
  }

  // Render full screen ArtifactCard
  // Copy ArtifactCard code here or assume it's imported.
  // For now, paste the ArtifactCard code adapted for full screen.

  const Icon = artifactIcons[artifact.type] || FileText;
  
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto bg-[#1a1a1a] rounded-xl p-8 border border-[#333333]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Icon className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">{artifact.title || 'Artifact'}</h1>
          </div>
          {/* Buttons */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => {
              navigator.clipboard.writeText(artifact.content);
              toast({
                description: "Content copied to clipboard",
                duration: 2000,
              });
            }}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              const blob = new Blob([artifact.content], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${artifact.title || 'artifact'}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}>
              <Download className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Share Artifact</h4>
                  <Input
                    type="text"
                    value={`${window.location.origin}/artifact?sessionId=${sessionId}&artifactIndex=${artifactIndex}`}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/artifact?sessionId=${sessionId}&artifactIndex=${artifactIndex}`;
                      navigator.clipboard.writeText(shareUrl);
                      toast({
                        description: "Link copied to clipboard",
                        duration: 2000,
                      });
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <MarkdownPreview
          source={artifact.content}
          style={{ background: 'transparent', color: '#e0e0e0' }}
          components={{
            a: ({ children, href, ...props }) => {
              const faviconUrl = getFaviconUrl(href);
              return (
                <a href={href} {...props} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {faviconUrl && <img src={faviconUrl} alt="" style={{ width: '16px', height: '16px', marginRight: '6px' }} />}
                  {children}
                </a>
              );
            }
          }}
        />
      </div>
    </div>
  );
};

export default ArtifactView; 