import { SuggestedWidget } from '../data/dataProfiler';

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'marketing' | 'sales' | 'product' | 'finance';
  icon: string;
  widgets: Omit<SuggestedWidget, 'confidence'>[];
  requiredColumns: string[];
}

// Pre-defined dashboard templates
export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'general-overview',
    name: 'General Overview',
    description: 'Key metrics, trends, and breakdowns for any dataset',
    category: 'general',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
    widgets: [
      {
        widgetType: 'kpi',
        title: 'Total Records',
        description: 'Count of all rows in the dataset',
        chartConfig: { xAxisKey: '', yAxisKeys: ['count'] },
      },
      {
        widgetType: 'bar',
        title: 'Top Categories',
        description: 'Distribution of the most common categorical values',
        chartConfig: { xAxisKey: 'category', yAxisKeys: ['count'] },
      },
      {
        widgetType: 'line',
        title: 'Trend Over Time',
        description: 'How numeric values change over time',
        chartConfig: { xAxisKey: 'date', yAxisKeys: ['value'] },
      },
      {
        widgetType: 'scatter',
        title: 'Correlation Explorer',
        description: 'Relationship between two numeric columns',
        chartConfig: { xAxisKey: 'x', yAxisKeys: ['y'] },
      },
    ],
    requiredColumns: ['category', 'date', 'value'],
  },
  {
    id: 'sales-performance',
    name: 'Sales Performance',
    description: 'Track revenue, deals, and team performance',
    category: 'sales',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    widgets: [
      {
        widgetType: 'kpi',
        title: 'Total Revenue',
        description: 'Sum of all revenue across the period',
        chartConfig: { xAxisKey: '', yAxisKeys: ['revenue'] },
      },
      {
        widgetType: 'bar',
        title: 'Revenue by Product',
        description: 'Revenue breakdown by product or service',
        chartConfig: { xAxisKey: 'product', yAxisKeys: ['revenue'] },
      },
      {
        widgetType: 'line',
        title: 'Revenue Trend',
        description: 'Revenue trajectory over time',
        chartConfig: { xAxisKey: 'date', yAxisKeys: ['revenue'] },
      },
      {
        widgetType: 'bar',
        title: 'Revenue by Region',
        description: 'Geographic revenue distribution',
        chartConfig: { xAxisKey: 'region', yAxisKeys: ['revenue'] },
      },
    ],
    requiredColumns: ['product', 'revenue', 'date', 'region'],
  },
  {
    id: 'marketing-funnel',
    name: 'Marketing Funnel',
    description: 'Track leads, conversions, and campaign performance',
    category: 'marketing',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
    widgets: [
      {
        widgetType: 'kpi',
        title: 'Total Leads',
        description: 'Total number of leads generated',
        chartConfig: { xAxisKey: '', yAxisKeys: ['leads'] },
      },
      {
        widgetType: 'bar',
        title: 'Leads by Channel',
        description: 'Lead sources and their effectiveness',
        chartConfig: { xAxisKey: 'channel', yAxisKeys: ['leads'] },
      },
      {
        widgetType: 'line',
        title: 'Conversion Rate Over Time',
        description: 'How conversion rate changes over time',
        chartConfig: { xAxisKey: 'date', yAxisKeys: ['conversion_rate'] },
      },
      {
        widgetType: 'scatter',
        title: 'Spend vs Conversions',
        description: 'Ad spend efficiency by campaign',
        chartConfig: { xAxisKey: 'spend', yAxisKeys: ['conversions'] },
      },
    ],
    requiredColumns: ['channel', 'leads', 'date', 'conversion_rate', 'spend', 'conversions'],
  },
  {
    id: 'product-analytics',
    name: 'Product Analytics',
    description: 'User engagement, feature adoption, and retention',
    category: 'product',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>',
    widgets: [
      {
        widgetType: 'kpi',
        title: 'Daily Active Users',
        description: 'Number of unique users per day',
        chartConfig: { xAxisKey: '', yAxisKeys: ['dau'] },
      },
      {
        widgetType: 'line',
        title: 'User Retention',
        description: 'Cohort retention over time',
        chartConfig: { xAxisKey: 'cohort_week', yAxisKeys: ['retention_rate'] },
      },
      {
        widgetType: 'bar',
        title: 'Feature Adoption',
        description: 'Usage of key features',
        chartConfig: { xAxisKey: 'feature', yAxisKeys: ['usage_count'] },
      },
      {
        widgetType: 'scatter',
        title: 'Engagement vs Retention',
        description: 'Relationship between engagement and retention',
        chartConfig: { xAxisKey: 'sessions', yAxisKeys: ['retention'] },
      },
    ],
    requiredColumns: ['dau', 'cohort_week', 'retention_rate', 'feature', 'usage_count', 'sessions', 'retention'],
  },
  {
    id: 'finance-overview',
    name: 'Finance Overview',
    description: 'Revenue, expenses, and profitability metrics',
    category: 'finance',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>',
    widgets: [
      {
        widgetType: 'kpi',
        title: 'Net Revenue',
        description: 'Total revenue minus expenses',
        chartConfig: { xAxisKey: '', yAxisKeys: ['net_revenue'] },
      },
      {
        widgetType: 'line',
        title: 'Revenue vs Expenses',
        description: 'Monthly revenue and expense trends',
        chartConfig: { xAxisKey: 'month', yAxisKeys: ['revenue', 'expenses'] },
      },
      {
        widgetType: 'bar',
        title: 'Expenses by Category',
        description: 'Breakdown of operational costs',
        chartConfig: { xAxisKey: 'category', yAxisKeys: ['amount'] },
      },
      {
        widgetType: 'kpi',
        title: 'Profit Margin',
        description: 'Profitability percentage',
        chartConfig: { xAxisKey: '', yAxisKeys: ['margin'] },
      },
    ],
    requiredColumns: ['net_revenue', 'month', 'revenue', 'expenses', 'category', 'amount', 'margin'],
  },
];

// Helper to find matching templates based on available columns
export function findMatchingTemplates(availableColumns: string[]): DashboardTemplate[] {
  return DASHBOARD_TEMPLATES.filter(template => {
    const required = template.requiredColumns;
    // A template matches if at least 50% of its required columns are available
    const matched = required.filter(col =>
      availableColumns.some(avail => avail.toLowerCase().includes(col.toLowerCase()) || col.toLowerCase().includes(avail.toLowerCase()))
    ).length;
    return matched / required.length >= 0.5;
  }).sort((a, b) => {
    // Sort by number of matched columns (descending)
    const aMatch = a.requiredColumns.filter(col =>
      availableColumns.some(avail => avail.toLowerCase().includes(col.toLowerCase()) || col.toLowerCase().includes(avail.toLowerCase()))
    ).length;
    const bMatch = b.requiredColumns.filter(col =>
      availableColumns.some(avail => avail.toLowerCase().includes(col.toLowerCase()) || col.toLowerCase().includes(avail.toLowerCase()))
    ).length;
    return bMatch - aMatch;
  });
}

export function getTemplateById(id: string): DashboardTemplate | undefined {
  return DASHBOARD_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: DashboardTemplate['category']): DashboardTemplate[] {
  return DASHBOARD_TEMPLATES.filter(t => t.category === category);
}