import React, { useState, useEffect } from 'react';

const ThinkingAnimation = () => {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-2 text-gray-400">
      <span>Thinking{'.'.repeat(dots)}</span>
    </div>
  );
};

export default ThinkingAnimation;