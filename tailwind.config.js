/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design token colors from CSS custom properties
        ground: '#f9fafb',
        surface: '#ffffff',
        raised: '#f3f4f6',
        border: '#e5e7eb',
        rule: '#f2f2f2',
        control: '#d1d5db',
        text: '#111827',
        muted: '#5f6672',
        accent: '#b8336a',
        'accent-soft': '#fdf2f7',
        'accent-track': '#f8dbe8',
        'accent-ink': '#6b1d3e',
        positive: '#247b50',
        negative: '#c4242a',
        warning: '#92400e',
        // Chart colors
        'chart-1': '#b8336a',
        'chart-2': '#6b7280',
        'chart-3': '#d4618f',
        // Pill colors
        'pill-positive-bg': '#dcfce7',
        'pill-positive-ink': '#14532d',
        'pill-negative-bg': '#ffedea',
        'pill-negative-ink': '#831c1e',
        'pill-warning-bg': '#fffbeb',
        'pill-warning-ink': '#92400e',
        'pill-neutral-bg': '#f3f4f6',
        'pill-neutral-ink': '#374151',
        'pill-accent-bg': '#fdf2f7',
        'pill-accent-ink': '#6b1d3e',
      },
      borderRadius: {
        'control': '6px',
        'card': '8px',
      },
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      spacing: {
        'pad': '24px',
        'gap': '24px',
        'row-height': '45px',
        'sidebar-width': '230px',
        'control-height': '32px',
      },
      fontSize: {
        'title': '32px',
        'section': '18px',
        'kpi': '24px',
        'body': '14px',
        'small': '12px',
      },
    },
  },
  plugins: [],
}