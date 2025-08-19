// components/loading.tsx
interface EnhancedLoadingStateProps {
  theme: 'light' | 'dark';
}


const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
    <div className="animate-pulse text-blue-900 font-medium">Loading leads...</div>
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
        <div className="w-3 h-3 bg-blue-900 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-3 h-3 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Loading your leads</h3>
        <p className="text-gray-500">Please wait while we fetch your data...</p>
      </div>
      
      {/* Progress Bar */}
      <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-blue-900 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);




const EnhancedLoadingState = ({ theme }: EnhancedLoadingStateProps) => (
  <div className="p-4">
    <div className="flex items-center justify-between mb-6">
      <div className={`animate-pulse ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} h-8 w-64 rounded`}></div>
      <div className={`animate-pulse ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} h-10 w-40 rounded-md`}></div>
    </div>

    <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border overflow-hidden`}>
      {/* Table Header Skeleton */}
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b p-4`}>
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`animate-pulse ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} h-4 rounded`}></div>
          ))}
        </div>
      </div>

      {/* Table Rows Skeleton */}
      <div className={`${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="grid grid-cols-7 gap-4 items-center">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className={`animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} h-4 rounded`}></div>
              ))}
              <div className="flex gap-2">
                <div className={`animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} h-8 w-16 rounded`}></div>
                <div className={`animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} h-8 w-16 rounded`}></div>
                <div className={`animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} h-8 w-32 rounded`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Pagination Skeleton */}
    <div className="mt-6 flex gap-2 items-center">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} h-8 w-10 rounded`}></div>
      ))}
      <div className={`animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} h-4 w-32 rounded ml-4`}></div>
    </div>

    {/* Floating Loading Indicator */}
    <div className={`fixed bottom-8 right-8 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-full shadow-lg border p-4`}>
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-900 border-t-transparent"></div>
        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Synching Arbitrage Operating System.
        </span>
      </div>
    </div>
  </div>
);
export {
  LoadingSpinner,
  LoadingCard,
  EnhancedLoadingState,
  MinimalLoadingState,
};