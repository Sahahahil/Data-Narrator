import * as React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { DuckDBManager } from './data/duckdbManager';
import { FileRegistry } from './data/fileRegistry';
import { SchemaInspector } from './data/schemaInspector';
import { QueryExecutor } from './data/queryExecutor';
import { PromptBuilder } from './ai/promptBuilder';
import { LLMClient } from './ai/llmClient';
import { ResponseParser } from './ai/responseParser';
import { SelfHealingController } from './ai/selfHealingController';
import { createWidget } from './ui/widgetFactory';
import { ChartConfigBuilder } from './ui/chartConfigBuilder';
import { AutoDashboard } from './ui/autoDashboard';
import { DataProfiler } from './data/dataProfiler';
import { ExportUtilities } from './widgets/exportUtilities';

interface ChartConfig {
  dataKey: string;
  xAxisKey: string;
  yAxisKeys: string[];
  groupKey?: string;
  title: string;
  description: string;
}

type WidgetType = 'line' | 'bar' | 'scatter' | 'kpi';

interface SessionData {
  fileName: string;
  fileSize: number;
  lastQuestion: string;
  widgetData: Record<string, unknown>[];
  widgetConfig: ChartConfig | null;
  widgetType: WidgetType | null;
  timestamp: number;
}

interface DashboardWidget {
  widgetType: WidgetType;
  config: ChartConfig;
  data: Record<string, unknown>[];
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [widgetData, setWidgetData] = useState<Record<string, unknown>[]>([]);
  const [widgetConfig, setWidgetConfig] = useState<ChartConfig | null>(null);
  const [widgetType, setWidgetType] = useState<WidgetType | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Dark mode state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  // Dashboard state
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([]);
  const [autoDashboardRunning, setAutoDashboardRunning] = useState(false);
  const [autoDashboardRan, setAutoDashboardRan] = useState(false);

  // Services (initialized once)
  const duckDBManagerRef = useRef<DuckDBManager | null>(null);
  const fileRegistryRef = useRef<FileRegistry | null>(null);
  const schemaInspectorRef = useRef<SchemaInspector | null>(null);
  const queryExecutorRef = useRef<QueryExecutor | null>(null);
  const promptBuilderRef = useRef<PromptBuilder | null>(null);
  const llmClientRef = useRef<LLMClient | null>(null);
  const responseParserRef = useRef<ResponseParser | null>(null);
  const selfHealingControllerRef = useRef<SelfHealingController | null>(null);
  const chartConfigBuilderRef = useRef<ChartConfigBuilder | null>(null);
  const autoDashboardRef = useRef<AutoDashboard | null>(null);
  const dataProfilerRef = useRef<DataProfiler | null>(null);
  const exportUtilitiesRef = useRef<ExportUtilities | null>(null);

  // Theme effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Initialize services once
  useEffect(() => {
    duckDBManagerRef.current = new DuckDBManager();
    fileRegistryRef.current = new FileRegistry(duckDBManagerRef.current);
    schemaInspectorRef.current = new SchemaInspector(duckDBManagerRef.current);
    queryExecutorRef.current = new QueryExecutor(duckDBManagerRef.current);
    promptBuilderRef.current = new PromptBuilder();
    llmClientRef.current = new LLMClient({
      apiKey: import.meta.env.VITE_LLM_API_KEY || '',
      endpoint: import.meta.env.VITE_LLM_ENDPOINT || 'https://api.openai.com/v1/chat/completions',
      model: import.meta.env.VITE_LLM_MODEL || 'gpt-4',
    });
    responseParserRef.current = new ResponseParser();
    chartConfigBuilderRef.current = new ChartConfigBuilder();
    autoDashboardRef.current = new AutoDashboard(chartConfigBuilderRef.current!);
    dataProfilerRef.current = new DataProfiler(queryExecutorRef.current!,
      { columns: [], sampleData: [], columnStats: {} },
      'uploaded_data');
    exportUtilitiesRef.current = new ExportUtilities();
  }, []);

  // Session persistence - save on successful query
  const saveSession = useCallback((data: {
    widgetData: Record<string, unknown>[];
    widgetConfig: ChartConfig | null;
    widgetType: WidgetType | null;
  }) => {
    if (!file) return;
    const session: SessionData = {
      fileName: file.name,
      fileSize: file.size,
      lastQuestion: question,
      widgetData: data.widgetData,
      widgetConfig: data.widgetConfig,
      widgetType: data.widgetType,
      timestamp: Date.now(),
    };
    localStorage.setItem('datastoryteller_session', JSON.stringify(session));
  }, [file, question]);

  // Session persistence - restore on mount
  useEffect(() => {
    const saved = localStorage.getItem('datastoryteller_session');
    if (saved) {
      try {
        const session: SessionData = JSON.parse(saved);
        if (Date.now() - session.timestamp < 7 * 24 * 60 * 60 * 1000) { // 7 days
          setQuestion(session.lastQuestion);
        }
      } catch { /* ignore */ }
    }
  }, []);

  // Auto-dashboard trigger on file upload
  useEffect(() => {
    if (file && !autoDashboardRan && !autoDashboardRunning) {
      runAutoDashboard();
    }
  }, [file]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      if (!f.name.endsWith('.csv') && !f.name.endsWith('.parquet')) {
        setError('Only CSV and Parquet files are supported');
        return;
      }
      if (f.size > 100 * 1024 * 1024) {
        setError('File too large (max 100MB)');
        return;
      }
      setFile(f);
      setError(null);
      setAutoDashboardRan(false); // Reset auto-dashboard for new file
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-accent', 'bg-accent-soft');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-accent', 'bg-accent-soft');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-accent', 'bg-accent-soft');
    if (e.dataTransfer.files[0]) {
      const nativeEvent = {
        target: { files: e.dataTransfer.files }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(nativeEvent);
    }
  }, [handleFileChange]);

  const removeFile = useCallback(() => {
    setFile(null);
    setError(null);
    setWidgetData([]);
    setWidgetConfig(null);
    setWidgetType(null);
    setQuestion('');
    setQueryError(null);
    setDashboardWidgets([]);
    setAutoDashboardRan(false);
  }, []);

  const runAutoDashboard = useCallback(async () => {
    if (!file || autoDashboardRunning) return;

    setAutoDashboardRunning(true);
    setAutoDashboardRan(true);

    try {
      const duckDBManager = duckDBManagerRef.current!;
      const fileRegistry = fileRegistryRef.current!;
      const queryExecutor = queryExecutorRef.current!;
      const schemaInspector = schemaInspectorRef.current!;
      const autoDashboard = autoDashboardRef.current!;
      const dataProfiler = dataProfilerRef.current!;

      await duckDBManager.initialize();
      await fileRegistry.registerFile('uploaded_data', file);

      // Get schema for profiler
      const schema = await schemaInspector.inspectTable('uploaded_data');
      dataProfilerRef.current = new DataProfiler(queryExecutor, schema, 'uploaded_data');

      // Profile the data
      const profile = await dataProfiler.profile();

      // Generate and execute dashboard
      const widgets = await autoDashboard.executeDashboard(
        profile,
        queryExecutor,
        'uploaded_data'
      );

      setDashboardWidgets(widgets);
    } catch (err) {
      console.warn('Auto-dashboard failed:', err);
    } finally {
      setAutoDashboardRunning(false);
    }
  }, [file]);

  const handleQuestionSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !file) return;

    setLoading(true);
    setQueryError(null);
    setWidgetData([]);
    setWidgetConfig(null);
    setWidgetType(null);

    try {
      const duckDBManager = duckDBManagerRef.current!;
      const fileRegistry = fileRegistryRef.current!;
      const selfHealingController = selfHealingControllerRef.current!;

      await duckDBManager.initialize();
      await fileRegistry.registerFile('uploaded_data', file);

      const result = await selfHealingController.executeWithRetry(question, 'uploaded_data');

      const chartConfig = chartConfigBuilderRef.current!.buildChartConfig(result.chartConfig, result.widgetType);
      setWidgetData(result.queryResult);
      setWidgetConfig(chartConfig);
      setWidgetType(result.widgetType);

      // Save session
      saveSession({ widgetData: result.queryResult, widgetConfig: chartConfig, widgetType: result.widgetType });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setQueryError(message);
    } finally {
      setLoading(false);
    }
  }, [question, file, saveSession]);

  const handleExportPNG = useCallback(() => {
    if (exportUtilitiesRef.current) {
      const container = document.querySelector('.chart-container') as HTMLElement | null;
      if (container) {
        exportUtilitiesRef.current.exportChartAsPNG(container, 'chart.png');
      }
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    if (exportUtilitiesRef.current && widgetData.length > 0) {
      exportUtilitiesRef.current.exportDataAsCSV(widgetData, 'data.csv');
    }
  }, [widgetData]);

  const handleExportDashboardPNG = useCallback(() => {
    if (exportUtilitiesRef.current) {
      const containers = document.querySelectorAll('.dashboard-grid .chart-container');
      containers.forEach((container, index) => {
        exportUtilitiesRef.current!.exportChartAsPNG(container as HTMLElement, `dashboard-chart-${index + 1}.png`);
      });
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  return (
    <div className="min-h-screen bg-ground text-text font-sans">
      <header className="bg-surface border-b border-rule px-pad py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-title font-bold text-text">Data Storyteller & BI Studio</h1>
            <p className="text-sm text-muted">Client-side data storytelling & BI studio</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>
      <main className="p-pad max-w-7xl mx-auto">
        {!file ? (
          <div className="mb-8">
            <label className="label">Upload CSV or Parquet file</label>
            <div
              className="drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label="upload zone"
            >
              <input
                type="file"
                accept=".csv,.parquet"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-lg text-text">Drag & drop your file here, or click to browse</p>
                <p className="text-sm text-muted mt-1">CSV or Parquet • Max 100MB</p>
              </label>
            </div>
            {error && (
              <p className="mt-3 text-negative text-sm" role="alert">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mb-4 p-4 bg-surface rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text">{file.name}</h2>
                  <p className="text-sm text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'unknown type'}</p>
                </div>
                <button
                  onClick={removeFile}
                  className="btn btn-ghost btn-sm"
                >
                  Remove
                </button>
              </div>
            </div>

            <form onSubmit={handleQuestionSubmit} className="mb-8">
              <label className="label">Ask a question about your data</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Show total value by category"
                  className="input flex-1"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="btn btn-primary"
                >
                  {loading ? 'Generating...' : 'Get Insights'}
                </button>
              </div>
            </form>

            {queryError && (
              <div className="error-banner">
                <p className="error-title">Error</p>
                <p className="error-message">{queryError}</p>
                <button
                  onClick={() => handleQuestionSubmit({ preventDefault: () => {}, currentTarget: document.querySelector('form') } as React.FormEvent<HTMLFormElement>)}
                  className="btn btn-secondary btn-sm"
                >
                  Retry
                </button>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="spinner-lg" />
              </div>
            )}

            {/* Auto-generated Dashboard */}
            {dashboardWidgets.length > 0 && (
              <div className="mb-8">
                <h3 className="text-section font-semibold text-text mb-4">Auto-Generated Dashboard</h3>
                <div className="dashboard-grid" role="region" aria-label="Auto-generated dashboard">
                  {dashboardWidgets.map((widget, index) => (
                    <div key={index} className="p-4 bg-surface rounded-xl border border-border">
                      <div className="chart-container h-72">
                        {widget.data.length === 0 ? (
                          <div className="h-full w-full animate-pulse bg-raised rounded" />
                        ) : (
                          <div className="h-full w-full">
                            {(() => {
                              const { type: WidgetComponent, config } = createWidget(widget.widgetType, { ...widget.config, data: widget.data });
                              return <WidgetComponent {...(config as unknown as Record<string, unknown>)} data={widget.data} />;
                            })()}
                          </div>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-text mt-2">{widget.config.title}</h4>
                      <p className="text-xs text-muted mt-1">{widget.config.description}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleExportDashboardPNG}
                    className="export-btn"
                    aria-label="Export all charts as PNG"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export All Charts (PNG)
                  </button>
                </div>
              </div>
            )}

            {/* Single Query Result */}
            {widgetData.length > 0 && widgetConfig && widgetType && (
              <div className="space-y-4">
                <div className="chart-container">
                  {(() => {
                    const { type: WidgetComponent, config } = createWidget(widgetType, { ...widgetConfig, data: widgetData });
                    return <WidgetComponent {...(config as unknown as Record<string, unknown>)} data={widgetData} />;
                  })()}
                </div>
                <div className="prose prose-slate max-w-none mt-4">
                  <p className="text-sm text-muted leading-relaxed">{widgetConfig.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportPNG}
                    className="export-btn"
                    aria-label="Export chart as PNG"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Chart (PNG)
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="export-btn"
                    aria-label="Export data as CSV"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Data (CSV)
                  </button>
                </div>
              </div>
            )}

            {queryError && (
              <div className="error-banner">
                <p className="error-title">Error</p>
                <p className="error-message">{queryError}</p>
                <button
                  onClick={() => handleQuestionSubmit({ preventDefault: () => {}, currentTarget: document.querySelector('form') } as React.FormEvent<HTMLFormElement>)}
                  className="btn btn-secondary btn-sm"
                >
                  Retry
                </button>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="spinner-lg" />
              </div>
            )}

            {autoDashboardRunning && (
              <div className="flex items-center justify-center py-12">
                <div className="spinner-lg" />
                <span className="ml-3 text-sm text-muted">Generating auto-dashboard...</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;