import React, { useEffect, useRef } from 'react';

const HtmlRenderer = ({ htmlContent, className = '' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!htmlContent || !containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Create a temporary container to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Extract script tags
    const scripts = tempDiv.getElementsByTagName('script');
    const scriptContents = [];
    
    // Store script contents and remove script tags
    Array.from(scripts).forEach(script => {
      if (script.src && script.src.includes('plotly')) {
        // Keep external Plotly CDN scripts
        scriptContents.push({ src: script.src, external: true });
      } else if (script.textContent) {
        // Store inline scripts
        scriptContents.push({ content: script.textContent, external: false });
      }
      script.remove();
    });

    // Set the HTML content without scripts
    containerRef.current.innerHTML = tempDiv.innerHTML;

    // Load external scripts first, then execute inline scripts
    const loadScripts = async () => {
      // Load external scripts
      for (const scriptInfo of scriptContents) {
        if (scriptInfo.external) {
          await loadExternalScript(scriptInfo.src);
        }
      }

      // Execute inline scripts after external scripts are loaded
      for (const scriptInfo of scriptContents) {
        if (!scriptInfo.external) {
          try {
            // Create a new script element and append it to execute
            const scriptElement = document.createElement('script');
            scriptElement.textContent = scriptInfo.content;
            containerRef.current.appendChild(scriptElement);
            // Remove the script element after execution
            scriptElement.remove();
          } catch (error) {
            console.error('Error executing script:', error);
          }
        }
      }
    };

    loadScripts();

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [htmlContent]);

  const loadExternalScript = (src) => {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`html-renderer ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default HtmlRenderer;