import React from 'react';
import { Clock } from 'lucide-react';

const ThinkingIndicator = ({ isThinking, thinkingContent, currentStep }) => {
  const [duration, setDuration] = React.useState(0);
  
  React.useEffect(() => {
    if (!isThinking) {
      setDuration(0);
      return;
    }
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isThinking]);

  if (!isThinking) return null;

  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
      <Clock className="w-3 h-3" />
      <span>Thought for {duration}s</span>
    </div>
  );
};

export default ThinkingIndicator;