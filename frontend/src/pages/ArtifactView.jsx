import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Session } from '@/api/entities';
import { API_ENDPOINTS } from '@/api/config';
import MarkdownPreview from "@uiw/react-markdown-preview";
import { FileText, Download, Share2, Copy, Table, Mail, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import HtmlRenderer from "@/components/HtmlRenderer";

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
  const chartRef = useRef(null);

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

  // Helper function to get Plotly chart element
  const getPlotlyChart = () => {
    if (!chartRef.current) return null;
    // Wait for plotly to be available
    const plotlyDiv = chartRef.current.querySelector('.plotly-graph-div');
    return plotlyDiv;
  };

  // Handle download based on artifact type
  const handleDownload = async () => {
    if (artifact.type === 'chart') {
      // Wait a bit for chart to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const plotlyDiv = getPlotlyChart();
      if (plotlyDiv && window.Plotly) {
        try {
          await window.Plotly.downloadImage(plotlyDiv, {
            format: 'png',
            filename: artifact.title || 'chart',
            width: 1200,
            height: 800
          });
        } catch (error) {
          console.error('Error downloading chart:', error);
          toast({ 
            description: 'Failed to download chart. Please try again.',
            duration: 3000,
          });
        }
      } else {
        toast({ 
          description: 'Unable to download chart. Please wait for it to load.',
          duration: 3000,
        });
      }
    } else {
      // Original markdown download logic
      const blob = new Blob([artifact.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${artifact.title || 'artifact'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Handle copy based on artifact type
  const handleCopy = async () => {
    if (artifact.type === 'chart') {
      // Wait a bit for chart to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const plotlyDiv = getPlotlyChart();
      if (plotlyDiv && window.Plotly) {
        try {
          // Convert chart to image
          const dataUrl = await window.Plotly.toImage(plotlyDiv, {
            format: 'png',
            width: 1200,
            height: 800
          });
          
          // Try to copy image to clipboard
          try {
            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            
            // Check if clipboard API supports writing images
            if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
              const clipboardItem = new ClipboardItem({
                'image/png': blob
              });
              await navigator.clipboard.write([clipboardItem]);
              toast({ 
                description: 'Chart copied as image successfully.',
                duration: 2000,
              });
            } else {
              throw new Error('Clipboard API not supported');
            }
          } catch (clipboardError) {
            // Fallback: Open image in new tab so user can right-click and copy
            console.log('Clipboard API failed, using fallback:', clipboardError);
            const win = window.open();
            if (win) {
              win.document.write(`<img src="${dataUrl}" style="max-width:100%;height:auto;" />`);
              win.document.title = artifact.title || 'Chart';
              toast({ 
                description: 'Chart opened in new tab. Right-click to copy.',
                duration: 4000,
              });
            } else {
              toast({ 
                description: 'Unable to copy chart. Please try downloading instead.',
                duration: 3000,
              });
            }
          }
        } catch (error) {
          console.error('Error processing chart:', error);
          toast({ 
            description: 'Failed to copy chart. Please try downloading instead.',
            duration: 3000,
          });
        }
      } else {
        toast({ 
          description: 'Unable to copy chart. Please wait for it to load.',
          duration: 3000,
        });
      }
    } else {
      // Original text copy logic
      navigator.clipboard.writeText(artifact.content);
      toast({
        description: "Content copied to clipboard",
        duration: 2000,
      });
    }
  };

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
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
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
        {artifact.type === 'chart' ? (
          <div ref={chartRef}>
            <HtmlRenderer 
              htmlContent={artifact.content}
              className="chart-container"
            />
          </div>
        ) : (
          <MarkdownPreview
            source={artifact.content}
            style={{ background: 'transparent', color: '#e0e0e0' }}
            className="markdown-preview-artifact"
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
                      fontSize: '0.875rem',
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
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#e5e7eb',
                    fontSize: '0.875rem'
                  }}
                >
                  {children}
                </th>
              ),
              td: ({ children, ...props }) => (
                <td 
                  {...props} 
                  style={{
                    padding: '0.75rem',
                    color: '#9ca3af',
                    fontSize: '0.875rem'
                  }}
                >
                  {children}
                </td>
              ),
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
        )}
      </div>
    </div>
  );
};

export default ArtifactView; 