// Chart colors derived from accent — monochromatic harmony
// Light mode accent: #b8336a (raspberry) mixed with white
// Dark mode accent: #f472b6 (pink-400) mixed with slate-800

export const CHART_COLORS_LIGHT = [
  '#b8336a', // 100% accent
  'rgb(213, 121, 157)', // 50%
  'rgb(180, 97, 128)',  // 25%
  'rgb(162, 77, 108)',  // 10%
  '#5f6672', // muted
];

export const CHART_COLORS_DARK = [
  '#f472b6', // 100% accent
  'rgb(236, 163, 186)', // 50%
  'rgb(210, 125, 148)', // 25%
  'rgb(190, 99, 124)',  // 10%
  '#94a3b8', // muted
];

// Default export for backward compatibility (light mode)
export const CHART_COLORS = CHART_COLORS_LIGHT;

export function getChartColors(isDark: boolean): string[] {
  return isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
}