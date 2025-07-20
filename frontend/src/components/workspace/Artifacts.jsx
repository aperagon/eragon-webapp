import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Share2, 
  Copy,
  Table,
  Mail,
  BarChart3,
  ExternalLink,
  Sparkles,
  Package,
  CheckCircle,
  ArrowUpRight,
  Pencil,
  X,
  MessageSquare
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import HtmlRenderer from "@/components/HtmlRenderer";

// Function to extract domain from URL
const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
};

// Function to get favicon URL
const getFaviconUrl = (url) => {
  const domain = extractDomain(url);
  if (!domain) return null;
  // Using Google's favicon service as a reliable fallback
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
};

const artifactIcons = {
  table: Table,
  brief: FileText,
  email: Mail,
  chart: BarChart3,
  file: Download
};

// Main component - remove tabs and directly render artifacts
export default function Artifacts({ session, realtimeArtifacts = [], className, isGenerating = false, onClose, onOpenChatHistory }) {
  // Merge session artifacts with realtime artifacts, avoiding duplicates
  const sessionArtifacts = session?.artifacts || [];
  const mergedArtifacts = useMemo(() => {
    // Create a map to track unique artifacts by title and content
    const artifactMap = new Map();
    
    // Add session artifacts first
    sessionArtifacts.forEach(artifact => {
      const key = `${artifact.title}-${artifact.content}`;
      artifactMap.set(key, artifact);
    });
    
    // Add realtime artifacts (will override if duplicate)
    realtimeArtifacts.forEach(artifact => {
      const key = `${artifact.title}-${artifact.content}`;
      artifactMap.set(key, artifact);
    });
    
    return Array.from(artifactMap.values());
  }, [sessionArtifacts, realtimeArtifacts]);
  
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editContent, setEditContent] = useState('');
  const [editedArtifacts, setEditedArtifacts] = useState({});
  const [currentTab, setCurrentTab] = useState("0");
  const [previousArtifactCount, setPreviousArtifactCount] = useState(0);

  // Auto-focus on the newest artifact when artifacts are added
  useEffect(() => {
    if (mergedArtifacts.length > 0) {
      // Only auto-focus if we have more artifacts than before (new artifact added)
      if (mergedArtifacts.length > previousArtifactCount) {
        // Set focus to the newest artifact (last in the array)
        const newestIndex = mergedArtifacts.length - 1;
        setCurrentTab(newestIndex.toString());
      }
      setPreviousArtifactCount(mergedArtifacts.length);
    }
  }, [mergedArtifacts.length, previousArtifactCount]);

  // Get the current artifacts with any edits applied
  const currentArtifacts = useMemo(() => {
    return mergedArtifacts.map((artifact, index) => {
      if (editedArtifacts[index]) {
        return { ...artifact, content: editedArtifacts[index] };
      }
      return artifact;
    });
  }, [mergedArtifacts, editedArtifacts]);

  if (mergedArtifacts.length === 0) {
    return (
      <Card className={`bg-[#1a1a1a] border-[#333333] flex flex-col h-full ${className}`}>
        <CardHeader className="pb-6">
                  <CardTitle className="text-white text-heading-2 flex items-center justify-between">
          <div className="flex items-center">
            <Package className="w-6 h-6 mr-3 text-indigo-400" />
            <div>
              <span className="text-white">Artifacts & Outputs</span>
              <p className="text-body text-[#e0e0e0] mt-1 font-normal">Generated insights and deliverables</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onOpenChatHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenChatHistory}
                className="text-[#cccccc] hover:text-white hover:bg-[#333333] p-2"
                title="Open Chat History"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-[#cccccc] hover:text-white hover:bg-[#333333] p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {isGenerating ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-body-large font-medium text-white">Generating Artifacts</p>
                <p className="text-caption text-[#cccccc] mt-2">Your insights are being prepared...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-[#e0e0e0]">
              <Sparkles className="w-8 h-8 mr-3 text-[#cccccc]" />
              <div className="text-center">
                <p className="text-body-large font-medium">No artifacts generated yet</p>
                <p className="text-caption text-[#cccccc] mt-2">Outputs will appear as the agent processes</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-[#1a1a1a] border-[#333333] flex flex-col h-full ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-white text-heading-2 flex items-center justify-between">
          <div className="flex items-center">
            <Package className="w-6 h-6 mr-3 text-indigo-400" />
            <span className="text-white">Artifacts & Outputs</span>
          </div>
          <div className="flex items-center space-x-2">
            {onOpenChatHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenChatHistory}
                className="text-[#cccccc] hover:text-white hover:bg-[#333333] p-2"
                title="Open Chat History"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-[#cccccc] hover:text-white hover:bg-[#333333] p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
        <div className="flex items-center space-x-4 mt-2">
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
          {session.context_entity && (
            <span className="text-body font-medium">• {session.context_entity}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="bg-transparent">
            {mergedArtifacts.map((artifact, index) => (
              <TabsTrigger key={index} value={`${index}`} className="capitalize">
                {artifact.title || `Artifact ${index + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>
                     {currentArtifacts.map((artifact, index) => (
             <TabsContent key={index} value={`${index}`} className="mt-4">
               <ArtifactCard artifact={artifact} index={index} session={session} setEditedArtifacts={setEditedArtifacts} editingIndex={editingIndex} setEditingIndex={setEditingIndex} editContent={editContent} setEditContent={setEditContent} />
             </TabsContent>
           ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Keep ArtifactCard, remove ActionCard
function ArtifactCard({ artifact, index, session, setEditedArtifacts, editingIndex, setEditingIndex, editContent, setEditContent }) {
  const Icon = artifactIcons[artifact.type] || FileText;
  const { toast } = useToast();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [accessLevel, setAccessLevel] = useState('public');
  const shareUrl = `${window.location.origin}/artifact?sessionId=${session.id}&artifactIndex=${index}`;

  const startEditing = () => {
    setEditingIndex(index);
    setEditContent(artifact.content);
  };

  const cancelEditing = () => {
    setEditingIndex(-1);
    setEditContent('');
  };

  const saveEditing = () => {
    setEditedArtifacts(prev => ({
      ...prev,
      [index]: editContent
    }));
    setEditingIndex(-1);
  };

  return (
    <div className="bg-black/60 rounded-xl p-6 border border-[#333333] hover:border-[#404040] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Icon className="w-5 h-5 text-indigo-400" />
          </div>
          <h4 className="text-heading-3 text-white">{artifact.title || 'Artifact'}</h4>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="text-[#cccccc] hover:text-white hover:bg-[#333333] p-2" onClick={() => startEditing()}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-[#cccccc] hover:text-white hover:bg-[#333333] p-2" onClick={() => {
            navigator.clipboard.writeText(artifact.content);
            toast({ 
              description: 'Artifact content copied successfully.',
              duration: 2000,
            });
          }}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-[#cccccc] hover:text-white hover:bg-[#333333] p-2" onClick={() => {
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
              <Button variant="ghost" size="sm" className="text-[#cccccc] hover:text-white hover:bg-[#333333] p-2">
                <Share2 className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-[#1a1a1a] border-[#333333] text-white" side="right">
              <div className="space-y-4">
                <h4 className="font-medium text-white">Share this artifact</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">Me</div>
                  <div className="text-white">Viewable by yourself only</div>
                </div>
                <Select value={accessLevel} onValueChange={setAccessLevel}>
                  <SelectTrigger className="w-full bg-black text-white border-[#333333]">
                    <SelectValue placeholder="Select access" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] text-white border-[#333333]">
                    <SelectItem value="private" className="text-white hover:bg-[#333333] hover:text-white focus:bg-[#333333] focus:text-white data-[highlighted]:bg-[#333333] data-[highlighted]:text-white">Only me</SelectItem>
                    <SelectItem value="public" className="text-white hover:bg-[#333333] hover:text-white focus:bg-[#333333] focus:text-white data-[highlighted]:bg-[#333333] data-[highlighted]:text-white">Anyone with the link can view</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Input value={shareUrl} readOnly className="flex-1 bg-black text-white border-[#333333]" />
                  <Button className="bg-indigo-500 hover:bg-indigo-600" onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast({ 
                      description: 'Share link copied to clipboard.',
                      duration: 2000,
                    });
                  }}>Copy link</Button>
                </div>
                <p className="text-xs text-gray-400">Do not share personal information or third-party content without permission.</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {editingIndex === index ? (
        <div className="space-y-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[400px] bg-black text-white border-[#333333]"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={cancelEditing}>Cancel</Button>
            <Button onClick={saveEditing}>Save</Button>
          </div>
        </div>
      ) : (
        artifact.type === 'chart' ? (
          <HtmlRenderer 
            htmlContent={artifact.content}
            className="chart-container"
          />
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
                    {faviconUrl && (
                      <img
                        src={faviconUrl}
                        alt=""
                        style={{ width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    {children}
                  </a>
                );
              }
            }}
          />
        )
      )}
    </div>
  );
}