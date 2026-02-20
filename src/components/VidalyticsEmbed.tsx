'use client';

import { useEffect, useRef, useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';

interface VidalyticsEmbedProps {
  videoId: string;
}

const VidalyticsEmbed = ({ videoId }: VidalyticsEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // This is your specific account ID found in your snippet (fumbuU7I)
  // If you use different accounts, you might want to make this a prop.
  const ACCOUNT_ID = 'fumbuU7I'; 

  useEffect(() => {
    if (!videoId) return;

    // 1. Define the unique ID exactly how Vidalytics expects it
    const embedId = `vidalytics_embed_${videoId}`;
    const embedUrl = `https://fast.vidalytics.com/embeds/${ACCOUNT_ID}/${videoId}/`;

    // 2. Setup the container
    if (containerRef.current) {
      containerRef.current.innerHTML = ''; // Clear previous
      
      // Create the target Div
      const targetDiv = document.createElement('div');
      targetDiv.id = embedId;
      targetDiv.style.width = '100%';
      targetDiv.style.position = 'relative';
      targetDiv.style.paddingTop = '56.25%'; // 16:9 Aspect Ratio
      containerRef.current.appendChild(targetDiv);

      // 3. Create the Script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      
      // We wrap the code in a try/catch to prevent page crashes
      script.innerHTML = `
        (function (v, i, d, a, l, y, t, c, s) {
            y='_'+d.toLowerCase();c=d+'L';if(!v[d]){v[d]={};}if(!v[c]){v[c]={};}if(!v[y]){v[y]={};}var vl='Loader',vli=v[y][vl],vsl=v[c][vl + 'Script'],vlf=v[c][vl + 'Loaded'],ve='Embed';
            if (!vsl){vsl=function(u,cb){
                if(t){cb();return;}s=i.createElement("script");s.type="text/javascript";s.async=1;s.src=u;
                if(s.readyState){s.onreadystatechange=function(){if(s.readyState==="loaded"||s.readyState=="complete"){s.onreadystatechange=null;vlf=1;cb();}};}else{s.onload=function(){vlf=1;cb();};}
                i.getElementsByTagName("head")[0].appendChild(s);
            };}
            vsl(l+'loader.min.js',function(){if(!vli){var vlc=v[c][vl];vli=new vlc();}vli.loadScript(l+'player.min.js',function(){var vec=v[d][ve];t=new vec();t.run(a);});});
        })(window, document, 'Vidalytics', '${embedId}', '${embedUrl}');
      `;

      containerRef.current.appendChild(script);
      
      // Fake a loading delay to hide the spinner once script injects
      setTimeout(() => setIsScriptLoaded(true), 1000);
    }

    return () => {
      // Cleanup to prevent memory leaks or duplicate players
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [videoId]);

  return (
    <div className="relative w-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
      {/* Loading Spinner (Z-Index 0: Sits behind video) */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
         <LoadingOutlined className="text-3xl text-[#5CC49D] animate-spin" />
      </div>

      {/* Video Container (Z-Index 10: Covers spinner) */}
      {/* We use min-h to ensure it has height even before video loads */}
      <div 
        ref={containerRef} 
        className="relative z-10 w-full min-h-[200px]"
      />
    </div>
  );
};

export default VidalyticsEmbed;