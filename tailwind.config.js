/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',
        'primary-foreground': '#FFFFFF',
        secondary: '#3B82F6',
        'secondary-foreground': '#000000',
        accent: '#D97706',
        'accent-foreground': '#000000',
        background: '#0F172A',
        foreground: '#F8FAFC',
        card: '#1E293B',
        'card-foreground': '#F8FAFC',
        muted: '#64748B',
        'muted-foreground': '#94A3B8',
        border: '#334155',
        destructive: '#EF4444',
        'destructive-foreground': '#FFFFFF',
        ring: '#1E40AF',
        slate: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
      },
      fontFamily: {
        sans: ['Fira Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}