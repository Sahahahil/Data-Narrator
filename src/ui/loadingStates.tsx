export const SkeletonLoader = (): JSX.Element => (
  <div className="h-64 w-full bg-slate-800 rounded-xl" />
);

export const LoadingSpinner = (): JSX.Element => (
  <div className="flex items-center justify-center h-64">
    <div className="h-10 w-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const ErrorBoundary = ({ error, onRetry }: { error: Error; onRetry?: () => void }): JSX.Element => (
  <div className="p-4 bg-red-900/50 rounded-xl">
    <h3 className="font-bold text-red-400 mb-2">Error</h3>
    <p className="text-slate-300 text-sm mb-4">{error.message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-sm"
      >
        Retry
      </button>
    )}
  </div>
);