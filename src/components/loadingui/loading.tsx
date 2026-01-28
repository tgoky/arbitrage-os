// components/loading.tsx
import React from 'react';

interface EnhancedLoadingStateProps {
  theme?: 'light' | 'dark'; // Kept for compatibility, but the design defaults to the requested premium dark look
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5CC49D]"></div>
    <div className="animate-pulse text-[#5CC49D] font-medium">Loading leads...</div>
  </div>
);

const LoadingCard = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="animate-pulse bg-zinc-900/50 rounded-lg p-4 space-y-3 border border-zinc-800"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
    <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
    <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
  </div>
);

const MinimalLoadingState = () => (
  <div className="p-4">
    {/* ... (Existing code kept as is for fallback) ... */}
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-[#5CC49D] rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-[#5CC49D] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-3 h-3 bg-[#5CC49D] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-zinc-700 mb-2">Loading your leads</h3>
      </div>
    </div>
  </div>
);

const EnhancedLoadingState = ({ theme = 'dark' }: EnhancedLoadingStateProps) => {
  // We force a dark/black base for the skeletons as requested to make it look cool/premium
  // regardless of the lightweight theme prop, though you can toggle the wrapper bg if needed.
  
  return (
    <div className="relative w-full min-h-[600px] p-8 overflow-hidden bg-[#000000] font-sans">
      
      {/* 1. Subtle Background Grid & Glow (Ambient Effects) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5CC49D] opacity-[0.03] blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 opacity-[0.03] blur-[120px] rounded-full"></div>
      </div>

      {/* 2. Top Bar / Breadcrumbs */}
      <div className="relative z-10 flex items-center justify-between mb-10">
        <div className="flex flex-col gap-2">
           <div className="h-3 w-24 bg-zinc-900 rounded-full animate-pulse"></div>
           <div className="h-8 w-64 bg-zinc-800 rounded-lg animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.02)]"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-full animate-pulse"></div>
          <div className="h-10 w-32 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* 3. Main Dashboard Card (Glassmorphism) */}
      <div className="relative z-10 w-full bg-[#09090b]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Loading "Scanner" Line - adds a high-tech feel */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#5CC49D]/50 to-transparent animate-shimmer-slide z-20"></div>

        {/* Card Header (Toolbar) */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex gap-4">
             {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-24 bg-zinc-900/80 rounded-md border border-white/5 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}></div>
             ))}
          </div>
          <div className="h-9 w-48 bg-zinc-900/80 rounded-md border border-white/5 animate-pulse"></div>
        </div>

        {/* Table Skeleton */}
        <div className="p-6">
          {/* Header Row */}
          <div className="grid grid-cols-6 gap-6 mb-6 px-4">
            {['w-1/4', 'w-1/6', 'w-1/6', 'w-1/6', 'w-1/6', 'w-1/12'].map((width, i) => (
              <div key={i} className={`h-3 bg-zinc-800 rounded-full opacity-50 ${width}`}></div>
            ))}
          </div>

          {/* Data Rows */}
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <div 
                key={rowIndex} 
                className="group relative grid grid-cols-6 gap-6 items-center p-4 rounded-xl border border-transparent bg-[#121214] hover:border-zinc-800 transition-colors"
                style={{ 
                  animation: 'fade-in-up 0.5s ease-out forwards',
                  animationDelay: `${rowIndex * 100}ms`,
                  opacity: 0 // Start hidden for animation
                }}
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 col-span-1">
                  <div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse"></div>
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-3 w-3/4 bg-zinc-800 rounded animate-pulse"></div>
                    <div className="h-2 w-1/2 bg-zinc-900 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Data Columns */}
                {Array.from({ length: 4 }).map((_, colIndex) => (
                   <div key={colIndex} className="col-span-1">
                      <div 
                        className="h-3 bg-zinc-800/80 rounded animate-pulse" 
                        style={{ width: `${Math.random() * 40 + 40}%`, animationDelay: `${(rowIndex * 100) + (colIndex * 50)}ms` }}
                      ></div>
                   </div>
                ))}

                {/* Action Button */}
                <div className="col-span-1 flex justify-end">
                   <div className="h-8 w-20 bg-zinc-900 rounded-lg border border-zinc-800 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Floating HUD (Status) */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="flex items-center gap-4 p-4 pr-6 bg-[#09090b] border border-zinc-800/80 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md">
           
           {/* High-tech Spinner */}
           <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="animate-spin duration-[3s] absolute inset-0 w-full h-full text-zinc-800" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="w-2 h-2 bg-[#5CC49D] rounded-full animate-ping"></div>
           </div>

           <div className="flex flex-col">
              <span className="text-zinc-200 text-sm font-semibold tracking-wide">Syncing Data</span>
              <span className="text-[#5CC49D] text-xs font-mono">EST: 2.3s</span>
           </div>

           {/* Animated Bar Graph */}
           <div className="flex gap-1 ml-4 items-end h-6">
              {[40, 70, 40, 100, 60].map((h, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-zinc-700 rounded-t-sm animate-pulse"
                  style={{ 
                    height: `${h}%`, 
                    animationDuration: '1s',
                    animationDelay: `${i * 100}ms`
                  }}
                ></div>
              ))}
           </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export {
  LoadingSpinner,
  LoadingCard,
  EnhancedLoadingState,
  MinimalLoadingState,
};