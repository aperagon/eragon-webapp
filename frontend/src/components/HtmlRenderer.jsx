import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const HtmlRenderer = forwardRef(({ htmlContent, className = '' }, ref) => {
  const containerRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    resizeCharts: () => {
      resizeCharts();
    }
  }));

  const resizeCharts = () => {
    if (!containerRef.current) return;
    
    // Find all Plotly chart elements and trigger resize
    const plotlyElements = containerRef.current.querySelectorAll('.plotly-graph-div');
    plotlyElements.forEach(element => {
      if (window.Plotly && element._fullData) {
        try {
          // Get the current container dimensions
          const container = element.closest('.chart-container') || element.parentElement;
          const width = container ? container.offsetWidth : element.offsetWidth;
          const height = container ? container.offsetHeight : element.offsetHeight;
          
          // Only resize if dimensions have actually changed
          if (width > 0 && height > 0) {
            window.Plotly.relayout(element, {
              width: width,
              height: height
            });
          }
        } catch (error) {
          console.warn('Error resizing Plotly chart:', error);
        }
      }
    });

    // Also handle other chart types that might be present
    const chartElements = containerRef.current.querySelectorAll('[id*="chart"], [class*="chart"]');
    chartElements.forEach(element => {
      // Trigger a resize event on the element
      const resizeEvent = new Event('resize', { bubbles: true });
      element.dispatchEvent(resizeEvent);
    });
  };

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

      // Resize charts after scripts are loaded
      setTimeout(resizeCharts, 100);
      
      // Also resize charts after a longer delay to handle async chart rendering
      setTimeout(resizeCharts, 500);
      setTimeout(resizeCharts, 1000);
    };

    loadScripts();

    // Set up ResizeObserver to watch for container size changes
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === containerRef.current) {
            // Debounce resize events
            clearTimeout(resizeObserverRef.current.resizeTimeout);
            resizeObserverRef.current.resizeTimeout = setTimeout(() => {
              resizeCharts();
            }, 100);
          }
        }
      });

      resizeObserverRef.current.observe(containerRef.current);
    }

    // Cleanup function
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
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
});

HtmlRenderer.displayName = 'HtmlRenderer';

export default HtmlRenderer;