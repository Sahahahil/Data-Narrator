import * as React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';

interface QueryHistoryItem {
  id: string;
  question: string;
  timestamp: number;
  widgetType?: string;
  chartConfig?: Record<string, unknown>;
}

const STORAGE_KEY = 'datastoryteller_query_history';
const MAX_HISTORY = 20;

export function QueryHistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(-MAX_HISTORY));
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage errors
    }
  }, [history]);

  const addQuery = useCallback((question: string, widgetType?: string, chartConfig?: Record<string, unknown>) => {
    const newItem: QueryHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      question,
      timestamp: Date.now(),
      widgetType,
      chartConfig,
    };
    setHistory(prev => {
      const updated = [...prev, newItem];
      return updated.slice(-MAX_HISTORY);
    });
  }, []);

  const removeQuery = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const value = useMemo(
    () => ({
      history: history.slice().reverse(), // Most recent first
      addQuery,
      removeQuery,
      clearHistory,
    }),
    [history, addQuery, removeQuery, clearHistory]
  );

  return (
    <QueryHistoryContext.Provider value={value}>
      {children}
    </QueryHistoryContext.Provider>
  );
}

const QueryHistoryContext = React.createContext<{
  history: QueryHistoryItem[];
  addQuery: (question: string, widgetType?: string, chartConfig?: Record<string, unknown>) => void;
  removeQuery: (id: string) => void;
  clearHistory: () => void;
} | null>(null);

export function useQueryHistory() {
  const context = React.useContext(QueryHistoryContext);
  if (!context) {
    throw new Error('useQueryHistory must be used within a QueryHistoryProvider');
  }
  return context;
}

// Sidebar component
export function QueryHistorySidebar() {
  const { history, removeQuery, clearHistory } = useQueryHistory();
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 btn btn-primary"
        aria-label={isOpen ? 'Close query history' : 'Open query history'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline ml-1">History</span>
        {history.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-negative text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {history.length > 9 ? '9+' : history.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-full sm:w-96 max-h-96 bg-surface rounded-xl shadow-xl overflow-hidden animate-slide-up" data-taste-skill-ignore="shadow">
          <div className="flex items-center justify-between p-4 bg-raised/50">
            <h3 className="text-lg font-semibold text-text">Query History</h3>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-sm text-negative hover:underline"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm"
                aria-label="Close history"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="max-h-[600px] overflow-y-auto p-2">
            <ul className="space-y-2">
              {history.map(item => (
                <li key={item.id} className="bg-raised/50 rounded-lg p-3 hover:bg-raised transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{item.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted">{formatTime(item.timestamp)}</span>
                        {item.widgetType && (
                          <span className="px-1.5 py-0.5 bg-accent-soft text-accent-ink text-xs rounded">
                            {item.widgetType.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          const event = new CustomEvent('query-history-replay', { detail: item });
                          window.dispatchEvent(event);
                        }}
                        className="btn btn-ghost btn-sm text-accent hover:bg-accent-soft p-1.5"
                        aria-label="Replay this query"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeQuery(item.id)}
                        className="btn btn-ghost btn-sm text-muted hover:text-negative hover:bg-negative/10 p-1.5"
                        aria-label="Remove from history"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

// Hook to listen for replay events in App
export function useQueryHistoryReplay(onReplay: (item: QueryHistoryItem) => void) {
  useEffect(() => {
    const handler = (event: CustomEvent) => onReplay(event.detail);
    window.addEventListener('query-history-replay', handler as EventListener);
    return () => window.removeEventListener('query-history-replay', handler as EventListener);
  }, [onReplay]);
}