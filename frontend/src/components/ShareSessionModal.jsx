import React, { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Session } from '@/api/entities';

export default function ShareSessionModal({ sessionId, isOpen, onOpenChange }) {
  const [accessLevel, setAccessLevel] = useState('public');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/shared-session?id=${sessionId}`;

  // Load current access level when modal opens
  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionAccessLevel();
    }
  }, [isOpen, sessionId]);

  const loadSessionAccessLevel = async () => {
    try {
      const session = await Session.get(sessionId);
      if (session && session.access_level) {
        setAccessLevel(session.access_level);
      }
    } catch (error) {
      console.error('Error loading session access level:', error);
    }
  };

  const handleAccessLevelChange = async (newAccessLevel) => {
    setIsUpdating(true);
    try {
      // Update access level in backend
      await Session.updateShareSettings(sessionId, newAccessLevel);
      setAccessLevel(newAccessLevel);
      toast({
        description: `Session is now ${newAccessLevel === 'public' ? 'public' : 'private'}.`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Error updating access level:', error);
      toast({
        title: 'Error',
        description: 'Failed to update share settings.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      description: 'Share link copied to clipboard.',
      duration: 2000,
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="text-[#cccccc] hover:text-white bg-transparent border-white/20 hover:bg-white/10"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-[#1a1a1a] border-[#333333] text-white" side="bottom" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-white">Share this session</h4>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">Me</div>
            <div className="text-white">Viewable by anyone with the link</div>
          </div>
          <Select value={accessLevel} onValueChange={handleAccessLevelChange} disabled={isUpdating}>
            <SelectTrigger className="w-full bg-black text-white border-[#333333]">
              <SelectValue placeholder="Select access" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] text-white border-[#333333]">
              <SelectItem 
                value="private" 
                className="text-white hover:bg-[#333333] hover:text-white focus:bg-[#333333] focus:text-white data-[highlighted]:bg-[#333333] data-[highlighted]:text-white"
              >
                Only me
              </SelectItem>
              <SelectItem 
                value="public" 
                className="text-white hover:bg-[#333333] hover:text-white focus:bg-[#333333] focus:text-white data-[highlighted]:bg-[#333333] data-[highlighted]:text-white"
              >
                Anyone with the link can view
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Input 
              value={shareUrl} 
              readOnly 
              className="flex-1 bg-black text-white border-[#333333]" 
            />
            <Button 
              className="bg-indigo-500 hover:bg-indigo-600" 
              onClick={handleCopyLink}
            >
              Copy link
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Do not share personal information or third-party content without permission.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}