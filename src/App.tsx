import * as React from 'react';
import { useState, useCallback } from 'react';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-slate-700');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-blue-500', 'bg-slate-700');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-slate-700');
    if (e.dataTransfer.files[0]) handleFileChange({ target: { files: e.dataTransfer.files } } as any);
  }, [handleFileChange]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 p-4 border-b border-slate-700">
        <h1 className="text-2xl font-bold">Data Storyteller & BI Studio</h1>
        <p className="text-sm text-slate-400">Phase 1: Foundation — Upload your data</p>
      </header>
      <main className="p-6 max-w-4xl mx-auto">
        {!file ? (
          <div className="mb-8">
            <label className="block text-sm font-medium mb-3">Upload CSV or Parquet file</label>
            <div
              className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors"
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
                <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-lg">Drag & drop your file here, or click to browse</p>
                <p className="text-sm text-slate-500 mt-1">CSV or Parquet • Max 100MB</p>
              </label>
            </div>
            {error && (
              <p className="mt-3 text-red-400 text-sm" role="alert">{error}</p>
            )}
          </div>
        ) : (
          <div className="mb-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{file.name}</h2>
                <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'unknown type'}</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-sm text-slate-400 hover:text-white"
              >
                Remove
              </button>
            </div>
            <p className="mt-4 text-slate-400">File ready. Phase 2 will add query interface.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;