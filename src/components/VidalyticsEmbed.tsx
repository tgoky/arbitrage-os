// components/VidalyticsEmbed.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface VidalyticsEmbedProps {
  videoId: string;
}

declare global {
  interface Window {
    Vidalytics?: any;
  }
}

const VidalyticsEmbed = ({ videoId }: VidalyticsEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clean up any existing Vidalytics instances
    const cleanup = () => {
      if (window.Vidalytics) {
        delete window.Vidalytics;
      }
    };

    const loadVidalytics = () => {
      if (!containerRef.current) return;

      try {
        // Clear the container first
        containerRef.current.innerHTML = '';

        // Create the div with the correct ID
        const embedDiv = document.createElement('div');
        embedDiv.id = `vidalytics_embed_${videoId}`;
        embedDiv.style.width = '100%';
        embedDiv.style.position = 'relative';
        embedDiv.style.paddingTop = '56.25%';
        containerRef.current.appendChild(embedDiv);

        // Create and append the script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerHTML = `
          (function (v, i, d, a, l, y, t, c, s) {
            y='_'+d.toLowerCase();c=d+'L';if(!v[d]){v[d]={};}if(!v[c]){v[c]={};}if(!v[y]){v[y]={};}var vl='Loader',vli=v[y][vl],vsl=v[c][vl + 'Script'],vlf=v[c][vl + 'Loaded'],ve='Embed';
            if (!vsl){vsl=function(u,cb){
                if(t){cb();return;}s=i.createElement("script");s.type="text/javascript";s.async=1;s.src=u;
                if(s.readyState){s.onreadystatechange=function(){if(s.readyState==="loaded"||s.readyState=="complete"){s.onreadystatechange=null;vlf=1;cb();}};}else{s.onload=function(){vlf=1;cb();};}
                i.getElementsByTagName("head")[0].appendChild(s);
            };}
            vsl(l+'loader.min.js',function(){if(!vli){var vlc=v[c][vl];vli=new vlc();}vli.loadScript(l+'player.min.js',function(){var vec=v[d][ve];t=new vec();t.run(a);});});
          })(window, document, 'Vidalytics', '${videoId}', 'https://fast.vidalytics.com/embeds/fumbuU7I/ICx2ePCXxSyHU52h/');
        `;

        containerRef.current.appendChild(script);
        setIsLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Error loading Vidalytics:', err);
        setError('Failed to load video');
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadVidalytics, 100);

    return () => {
      clearTimeout(timer);
      cleanup();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [videoId]);

  if (error) {
    return (
      <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full"
    />
  );
};

export default VidalyticsEmbed;