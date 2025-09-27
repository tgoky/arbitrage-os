// components/loading.tsx
interface EnhancedLoadingStateProps {
  theme: 'light' | 'dark';
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5CC49D]"></div>
    <div className="animate-pulse text-[#5CC49D] font-medium">Loading leads...</div>
  </div>
);

const LoadingCard = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="animate-pulse bg-gray-200 rounded-lg p-4 space-y-3"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
  </div>
);

const MinimalLoadingState = () => (
  <div className="p-4">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-gray-800">Primary Calling List</h1>
      <div className="animate-pulse bg-gray-300 h-10 w-40 rounded-md"></div>
    </div>
    
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      {/* Animated Dots */}
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-[#5CC49D] rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-[#5CC49D] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-3 h-3 bg-[#5CC49D] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Loading your leads</h3>
        <p className="text-gray-500">Please wait while we fetch your data...</p>
      </div>
      
      {/* Progress Bar */}
      <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-[#5CC49D] rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

const EnhancedLoadingState = ({ theme }: EnhancedLoadingStateProps) => (
  <div className="p-6">
    {/* Header with shimmer effect */}
    <div className="flex items-center justify-between mb-8">
      <div className="relative">
        <div className={`animate-pulse ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} h-8 w-64 rounded-lg`}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      </div>
      <div className="relative">
        <div className={`animate-pulse ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} h-10 w-40 rounded-xl`}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      </div>
    </div>

    {/* Main card with glass morphism effect */}
    <div className={`relative rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50' 
        : 'bg-gradient-to-br from-white/80 to-gray-50/80 border border-gray-200/50'
    }`}>
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-[#5CC49D] via-[#3B82F6] to-[#8B5CF6] animate-gradient-x"></div>
      </div>

      {/* Table Header */}
      <div className={`relative p-6 border-b ${
        theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'
      }`}>
        <div className="grid grid-cols-7 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="relative">
              <div className={`animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} h-5 rounded-full`}></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Rows with staggered animation */}
      <div className="divide-y divide-gray-200/20">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-6 relative group">
            {/* Row hover effect */}
            <div className={`absolute inset-0 ${
              theme === 'dark' ? 'bg-gray-700/20' : 'bg-gray-100/30'
            } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            <div className="grid grid-cols-7 gap-6 items-center relative">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="relative">
                  <div 
                    className={`animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} h-4 rounded-full`}
                    style={{ animationDelay: `${j * 100}ms` }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                </div>
              ))}
              <div className="flex gap-3">
                {[16, 16, 32].map((width, index) => (
                  <div key={index} className="relative">
                    <div 
                      className={`animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} h-8 rounded-xl`}
                      style={{ width: `${width}px`, animationDelay: `${index * 200}ms` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Enhanced Pagination */}
    <div className="mt-8 flex items-center justify-between">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative">
            <div 
              className={`animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} h-10 w-10 rounded-xl`}
              style={{ animationDelay: `${i * 100}ms` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          </div>
        ))}
      </div>
      <div className="relative">
        <div className={`animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} h-4 w-48 rounded-full`}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
      </div>
    </div>

    {/* Premium Floating Loader */}
    <div className={`fixed bottom-8 right-8 rounded-2xl shadow-2xl backdrop-blur-md border p-4 z-50 ${
      theme === 'dark' 
        ? 'bg-gray-900/80 border-gray-700/50' 
        : 'bg-white/80 border-gray-200/50'
    }`}>
      <div className="flex items-center space-x-4">
        {/* Animated spinner with gradient */}
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#5CC49D] border-t-transparent"></div>
          <div className="absolute inset-0 animate-spin rounded-full h-8 w-8 border-4 border-[#5CC49D]/30 border-t-transparent" style={{ animationDirection: 'reverse' }}></div>
        </div>
        
        <div className="flex flex-col">
          <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            Syncing ArbitrageOS
          </span>
          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Preparing your workspace...
          </span>
        </div>
        
        {/* Progress dots */}
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#5CC49D] opacity-60"
              style={{
                animation: `bounce 1.4s infinite ease-in-out`,
                animationDelay: `${i * 0.16}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>

    {/* Background pattern */}
    <div className="fixed inset-0 -z-10 opacity-5">
      <div className={`absolute inset-0 ${
        theme === 'dark' 
          ? 'bg-[linear-gradient(45deg,#5CC49D_1px,transparent_1px),linear-gradient(-45deg,#5CC49D_1px,transparent_1px)]' 
          : 'bg-[linear-gradient(45deg,#5CC49D_1px,transparent_1px),linear-gradient(-45deg,#5CC49D_1px,transparent_1px)]'
      }`} style={{ backgroundSize: '32px 32px' }}></div>
    </div>
  </div>
);

export {
  LoadingSpinner,
  LoadingCard,
  EnhancedLoadingState,
  MinimalLoadingState,
};