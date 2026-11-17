import * as React from 'react';
import { useState, useCallback } from 'react';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true);
      setError(null);
      setFile(f);
      setTimeout(() => setIsLoading(false), 100);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary', 'bg-card');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-primary', 'bg-card');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'bg-card');
    if (e.dataTransfer.files[0]) handleFileChange({ target: { files: e.dataTransfer.files } } as any);
  }, [handleFileChange]);

  const removeFile = useCallback(() => {
    setFile(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="bg-card border-b border-border p-4">
        <h1 className="text-2xl font-bold">Data Storyteller & BI Studio</h1>
        <p className="text-sm text-muted-foreground">Phase 1: Foundation — Upload your data</p>
      </header>
      <main className="p-6 max-w-4xl mx-auto">
        {!file ? (
          <div className="mb-8">
            <label className="block text-sm font-medium mb-3" htmlFor="file-upload">
              Upload CSV or Parquet file
            </label>
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors duration-200"
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
                disabled={isLoading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-lg">Drag & drop your file here, or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">CSV or Parquet • Max 100MB</p>
                {isLoading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Registering file...</span>
                  </div>
                )}
              </label>
            </div>
            {error && (
              <p className="mt-3 text-destructive text-sm" role="alert">{error}</p>
            )}
          </div>
        ) : (
          <div className="mb-8 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{file.name}</h2>
                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'unknown type'}</p>
              </div>
              <button
                onClick={removeFile}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Remove
              </button>
            </div>
            <p className="mt-4 text-muted-foreground">File ready. Phase 2 will add query interface.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;