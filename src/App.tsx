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
import { createSampleFile } from './data/sampleData';
import { useScrollReveal, useStaggeredReveal } from './ui/scrollReveal';
import { FilterProvider, useFilter } from './ui/FilterContext';
import { QueryHistoryProvider, QueryHistorySidebar, useQueryHistoryReplay } from './ui/QueryHistory';
import { DashboardTemplatePicker } from './ui/DashboardTemplatePicker';
import { DashboardTemplate, getTemplateById } from './ui/DashboardTemplates';

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

interface ShareableState {
  question: string;
  dashboardWidgets: DashboardWidget[];
  templateId?: string;
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

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate | null>(null);

  // Shareable URL state
  const [shareUrl, setShareUrl] = useState<string>('');

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

  // Restore state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get('state');
    if (stateParam) {
      try {
        const decoded = JSON.parse(atob(stateParam)) as ShareableState;
        if (decoded.question) setQuestion(decoded.question);
        if (decoded.templateId) {
          const template = getTemplateById(decoded.templateId);
          if (template) setSelectedTemplate(template);
        }
        // Dashboard widgets will be restored after file upload
        if (decoded.dashboardWidgets.length > 0) {
          // Store for later restoration after file is loaded
          sessionStorage.setItem('pendingDashboardWidgets', JSON.stringify(decoded.dashboardWidgets));
        }
      } catch {
        // Ignore invalid state
      }
    }
  }, []);

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

  const handleSampleData = useCallback(async () => {
    const sampleFile = createSampleFile();
    setFile(sampleFile);
    setError(null);
    setAutoDashboardRan(false);
    // Apply selected template if any
    if (selectedTemplate) {
      applyTemplate(selectedTemplate);
    }
  }, [selectedTemplate]);

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

      // If template is selected, use template widgets instead of auto-generated
      let widgets: DashboardWidget[];
      if (selectedTemplate) {
        widgets = await applyTemplateWidgets(selectedTemplate, queryExecutor);
        setSelectedTemplate(null); // Clear after applying
      } else {
        // Generate and execute dashboard
        widgets = await autoDashboard.executeDashboard(
          profile,
          queryExecutor,
          'uploaded_data'
        );
      }

      // Check for pending dashboard widgets from URL restore
      const pendingWidgets = sessionStorage.getItem('pendingDashboardWidgets');
      if (pendingWidgets) {
        try {
          const parsed = JSON.parse(pendingWidgets) as DashboardWidget[];
          // Merge with existing widgets
          widgets = [...widgets, ...parsed];
          sessionStorage.removeItem('pendingDashboardWidgets');
        } catch { /* ignore */ }
      }

      setDashboardWidgets(widgets);
    } catch (err) {
      console.warn('Auto-dashboard failed:', err);
    } finally {
      setAutoDashboardRunning(false);
    }
  }, [file, selectedTemplate]);

  // Apply template to dashboard (convert template widgets to dashboard widgets)
  const applyTemplateWidgets = useCallback(async (
    template: DashboardTemplate,
    queryExecutor: QueryExecutor
  ): Promise<DashboardWidget[]> => {
    const widgets: DashboardWidget[] = [];

    for (const tmplWidget of template.widgets) {
      const chartConfig = chartConfigBuilderRef.current!.buildChartConfig(
        {
          xAxisKey: tmplWidget.chartConfig.xAxisKey,
          yAxisKeys: tmplWidget.chartConfig.yAxisKeys,
          groupKey: tmplWidget.chartConfig.groupKey,
          title: tmplWidget.title,
          description: tmplWidget.description,
        },
        tmplWidget.widgetType
      );

      // Build SQL for this widget
      const sql = buildSqlFromTemplateConfig(chartConfig, 'uploaded_data');

      try {
        const data = await queryExecutor.execute(sql);
        widgets.push({
          widgetType: tmplWidget.widgetType as WidgetType,
          config: chartConfig,
          data,
        });
      } catch {
        // Silently handle errors - widget will have empty data
        widgets.push({
          widgetType: tmplWidget.widgetType as WidgetType,
          config: chartConfig,
          data: [],
        });
      }
    }

    return widgets;
  }, []);

  // Build SQL from template widget config
  const buildSqlFromTemplateConfig = useCallback((
    config: { dataKey: string; xAxisKey: string; yAxisKeys: string[]; groupKey?: string },
    tableName: string
  ): string => {
    const { xAxisKey, yAxisKeys, groupKey } = config;

    if (!xAxisKey) {
      return `SELECT SUM(${yAxisKeys[0]}) as total FROM ${tableName}`;
    }

    const selectCols = [xAxisKey, ...yAxisKeys];
    if (groupKey) {
      selectCols.push(groupKey);
    }

    const groupBy = groupKey ? `GROUP BY ${groupKey}, ${xAxisKey}` : `GROUP BY ${xAxisKey}`;

    return `SELECT ${selectCols.join(', ')} FROM ${tableName} ${groupBy} ORDER BY ${xAxisKey}`;
  }, []);

  // Apply template (store for later when file is uploaded)
  const applyTemplate = useCallback((template: DashboardTemplate) => {
    setSelectedTemplate(template);
  }, []);

  // Generate shareable URL
  const generateShareUrl = useCallback(() => {
    const state: ShareableState = {
      question,
      dashboardWidgets: dashboardWidgets.map(w => ({
        ...w,
        data: [], // Don't include data in URL (too large)
      })),
      templateId: selectedTemplate?.id,
    };
    const encoded = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url);
    alert('Shareable link copied to clipboard!');
  }, [question, dashboardWidgets, selectedTemplate]);

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

  const heroReveal = useScrollReveal({ threshold: 0.1 });
const dashboardReveal = useStaggeredReveal(dashboardWidgets.length, { threshold: 0.1 });

// Handle query history replay
useQueryHistoryReplay((item) => {
  setQuestion(item.question);
  handleQuestionSubmit({ preventDefault: () => {}, currentTarget: document.querySelector('form') } as React.FormEvent<HTMLFormElement>);
});

function FilterIndicator() {
  const { filter, clearFilter, isFiltered } = useFilter();
  if (!isFiltered) return null;
  return (
    <div className="bg-accent-soft px-pad py-2 animate-slide-up">
      <div className="max-w-7xl mx-auto flex items-center gap-2">
        <span className="text-sm font-medium text-accent-ink">Filtered by</span>
        <span className="px-2 py-0.5 bg-accent text-white text-xs rounded">{filter.label}</span>
        <span className="text-sm text-accent-ink/70">=</span>
        <span className="px-2 py-0.5 bg-white text-accent text-xs rounded">{String(filter.value)}</span>
        <button
          onClick={clearFilter}
          className="ml-2 btn btn-ghost btn-sm text-accent-ink hover:bg-accent-track"
          aria-label="Clear filter"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

return (
    <FilterProvider>
    <QueryHistoryProvider>
      <div className="min-h-[100svh] bg-ground text-text font-sans">
        <header className="bg-surface px-pad py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-title font-bold text-text tracking-tight motion-fade-in motion-rise">CSV → Dashboard.</h1>
              <p className="text-sm text-muted mt-1 motion-fade-in motion-rise motion-delay-1">Client-side BI studio — your data never leaves the browser</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="btn btn-ghost btn-sm"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span className={`theme-toggle-icon ${theme === 'dark' ? 'rotated' : ''}`}>
                  {theme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </div>
        </header>
        {/* Filter Indicator Bar */}
        <FilterIndicator />
        <QueryHistorySidebar />
        <main className="p-pad max-w-7xl mx-auto">
        {!file ? (
          <div className={`mb-8 ${heroReveal.isVisible ? 'motion-fade-in motion-rise' : 'opacity-0 translate-y-6'}`} ref={heroReveal.ref}>
            <div className="space-y-8 lg:space-y-12">
              {/* Hero content */}
              <div className="text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
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
                <div className="mt-4 flex items-center justify-center lg:justify-start gap-4 flex-wrap">
              <button
                onClick={handleSampleData}
                className="btn btn-secondary"
                aria-label="Try with sample coffee shop sales data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Try Sample Data
              </button>
              <DashboardTemplatePicker
                availableColumns={['category', 'date', 'value', 'revenue', 'product', 'region', 'channel', 'leads', 'conversions', 'spend', 'dau', 'retention', 'feature', 'sessions', 'net_revenue', 'expenses', 'margin']}
                onApplyTemplate={applyTemplate}
              />
              <span className="text-sm text-muted">or</span>
            </div>
              </div>

              {/* Full-width hero image - real archival data visualization */}
              <div className="relative w-full motion-scale-in motion-delay-1">
                <img
                  src="/assets/minard-real.png"
                  alt="Minard's 1869 map of Napoleon's Russian campaign - a landmark in data visualization"
                  className="w-full h-auto rounded-xl"
                  width="1200"
                  height="600"
                />
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 motion-fade-in motion-rise" style={{ transitionDelay: '300ms' }}>
                <div className="text-center motion-scale-in" style={{ transitionDelay: '350ms' }}>
                  <img src="/assets/feature-upload.png" alt="Upload" className="mx-auto mb-2" width="120" height="120" />
                  <p className="text-sm font-medium text-text">Upload Files</p>
                </div>
                <div className="text-center motion-scale-in" style={{ transitionDelay: '400ms' }}>
                  <img src="/assets/feature-query.png" alt="Query" className="mx-auto mb-2" width="120" height="120" />
                  <p className="text-sm font-medium text-text">Ask Questions</p>
                </div>
                <div className="text-center motion-scale-in" style={{ transitionDelay: '450ms' }}>
                  <img src="/assets/feature-chart.png" alt="Chart" className="mx-auto mb-2" width="120" height="120" />
                  <p className="text-sm font-medium text-text">Auto Charts</p>
                </div>
                <div className="text-center motion-scale-in" style={{ transitionDelay: '500ms' }}>
                  <img src="/assets/feature-export.png" alt="Export" className="mx-auto mb-2" width="120" height="120" />
                  <p className="text-sm font-medium text-text">Export PDF</p>
                </div>
              </div>

              {/* Archival data visualization heritage */}
              <div className="motion-fade-in motion-rise" style={{ transitionDelay: '550ms' }}>
                <h4 className="text-sm font-semibold text-muted mb-4 tracking-wide">DATA STORYTELLING HERITAGE</h4>
                <div className="grid grid-cols-4 gap-6">
                  <figure className="motion-scale-in" style={{ transitionDelay: '600ms' }}>
                    <img
                      src="/assets/minard.png"
                      alt="Minard's 1869 map of Napoleon's Russian campaign"
                      className="w-full h-auto rounded-lg"
                      width="400"
                      height="300"
                    />
                    <figcaption className="text-sm text-muted mt-1 text-center">Minard (1869)</figcaption>
                  </figure>
                  <figure className="motion-scale-in" style={{ transitionDelay: '650ms' }}>
                    <img
                      src="/assets/nightingale.png"
                      alt="Nightingale's 1858 rose diagram"
                      className="w-full h-auto rounded-lg"
                      width="400"
                      height="300"
                    />
                    <figcaption className="text-sm text-muted mt-1 text-center">Nightingale (1858)</figcaption>
                  </figure>
                  <figure className="motion-scale-in" style={{ transitionDelay: '700ms' }}>
                    <img
                      src="/assets/playfair.png"
                      alt="Playfair's 1786 time series"
                      className="w-full h-auto rounded-lg"
                      width="400"
                      height="300"
                    />
                    <figcaption className="text-sm text-muted mt-1 text-center">Playfair (1786)</figcaption>
                  </figure>
                  <figure className="motion-scale-in" style={{ transitionDelay: '750ms' }}>
                    <img
                      src="/assets/snow.png"
                      alt="Snow's 1854 cholera map"
                      className="w-full h-auto rounded-lg"
                      width="400"
                      height="300"
                    />
                    <figcaption className="text-sm text-muted mt-1 text-center">Snow (1854)</figcaption>
                  </figure>
                </div>
              </div>
                {error && (
                  <p className="mt-3 text-negative text-sm" role="alert">{error}</p>
                )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mb-4 p-4 bg-surface rounded-lg">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold text-text">{file.name}</h2>
                  <p className="text-sm text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'unknown type'}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DashboardTemplatePicker
                    availableColumns={dashboardWidgets.length > 0
                      ? [...new Set(dashboardWidgets.flatMap(w => [w.config.xAxisKey, ...w.config.yAxisKeys].filter(Boolean)))]
                      : ['category', 'date', 'value', 'revenue', 'product', 'region', 'channel', 'leads', 'conversions', 'spend', 'dau', 'retention', 'feature', 'sessions', 'net_revenue', 'expenses', 'margin']}
                    onApplyTemplate={applyTemplate}
                  />
                  <button
                    onClick={generateShareUrl}
                    className="btn btn-secondary btn-sm"
                    aria-label="Generate shareable dashboard link"
                    disabled={dashboardWidgets.length === 0 && !question}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="hidden sm:inline">Share</span>
                  </button>
                  <button
                    onClick={removeFile}
                    className="btn btn-ghost btn-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
            {shareUrl && (
              <div className="mb-4 p-4 bg-accent-soft rounded-lg animate-slide-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-sm font-medium text-accent-ink">Shareable link copied to clipboard!</span>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(shareUrl); }}
                    className="btn btn-ghost btn-sm text-accent-ink hover:bg-accent-track"
                    aria-label="Copy link again"
                  >
                    Copy again
                  </button>
                </div>
                <p className="text-xs text-accent-ink/70 mt-1 break-all">{shareUrl}</p>
              </div>
            )}

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
              <div className={`mb-8 ${dashboardReveal.visibleIndices.size > 0 ? 'scroll-reveal-stagger' : ''}`} ref={dashboardReveal.ref}>
                <h3 className="text-section font-semibold text-text mb-4 scroll-reveal">Auto-Generated Dashboard</h3>
                <div className="dashboard-grid" role="region" aria-label="Auto-generated dashboard">
                  {dashboardWidgets.map((widget, index) => (
                    <div key={index} className={`p-4 bg-surface rounded-xl border border-border motion-fade-in motion-rise ${widget.widgetType === 'kpi' ? 'kpi-full' : ''}`} style={{ transitionDelay: `${index * 60}ms` }}>
                      <div className="chart-container h-72">
                        {widget.data.length === 0 ? (
                          <div className="h-full w-full bg-raised rounded" role="status" aria-label="Loading chart data" />
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

            {/* Data Storytelling Heritage */}
            <div className="mb-12 motion-fade-in motion-rise">
              <h3 className="text-section font-semibold text-text mb-6 scroll-reveal">Data Storytelling Heritage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <figure className="scroll-reveal motion-fade-in motion-rise" style={{ transitionDelay: '100ms' }}>
                  <img
                    src="/assets/minard.png"
                    alt="Minard's 1869 map of Napoleon's Russian campaign"
                    className="w-full h-auto rounded-lg"
                    width="400"
                    height="300"
                  />
                  <figcaption className="text-sm text-muted mt-2 text-center">Minard's Napoleon Map (1869)</figcaption>
                </figure>
                <figure className="scroll-reveal motion-fade-in motion-rise" style={{ transitionDelay: '200ms' }}>
                  <img
                    src="/assets/nightingale.png"
                    alt="Nightingale's 1858 rose diagram of mortality causes"
                    className="w-full h-auto rounded-lg"
                    width="400"
                    height="300"
                  />
                  <figcaption className="text-sm text-muted mt-2 text-center">Nightingale's Rose Diagram (1858)</figcaption>
                </figure>
                <figure className="scroll-reveal motion-fade-in motion-rise" style={{ transitionDelay: '300ms' }}>
                  <img
                    src="/assets/playfair.png"
                    alt="Playfair's 1786 time series chart of wheat prices"
                    className="w-full h-auto rounded-lg"
                    width="400"
                    height="300"
                  />
                  <figcaption className="text-sm text-muted mt-2 text-center">Playfair's Time Series (1786)</figcaption>
                </figure>
                <figure className="scroll-reveal motion-fade-in motion-rise" style={{ transitionDelay: '400ms' }}>
                  <img
                    src="/assets/snow.png"
                    alt="John Snow's 1854 cholera map of London"
                    className="w-full h-auto rounded-lg"
                    width="400"
                    height="300"
                  />
                  <figcaption className="text-sm text-muted mt-2 text-center">Snow's Cholera Map (1854)</figcaption>
                </figure>
              </div>
            </div>

            {/* Single Query Result */}

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
  </QueryHistoryProvider>
  </FilterProvider>
  );
}

export default App;