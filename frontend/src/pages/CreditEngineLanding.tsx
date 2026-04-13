import { useEffect, useRef } from 'react';

/**
 * CreditEngineLanding
 * Renders the standalone creditengine.html file (which lives in /public/)
 * as a full-viewport iframe.  All HTML, CSS and JavaScript inside the file
 * run natively in the iframe – zero re-implementation needed.
 *
 * Outbound CTA links in the HTML (e.g. "Launch App" → /#/score) navigate
 * the *parent* window so the React router handles them normally.
 */
export default function CreditEngineLanding() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // When a link inside the iframe targets the parent app (/#/...)
    // the browser follows it in the parent frame automatically because
    // the href is absolute.  Nothing extra needed.

    // Optional: sync iframe scroll position so browser-level anchor links
    // (#wines, #museum, etc.) work correctly within the iframe.
    const handleLoad = () => {
      const iDoc = iframe.contentDocument;
      if (!iDoc) return;
      // Intercept any <a> that points to the parent app routes
      iDoc.querySelectorAll<HTMLAnchorElement>('a[href^="/#/"]').forEach(a => {
        a.setAttribute('target', '_parent');
      });
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src="/creditengine.html"
      title="CreditEngine — Precision Credit Intelligence"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        zIndex: 0,
      }}
      // allow scripts and same-origin content
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
    />
  );
}
