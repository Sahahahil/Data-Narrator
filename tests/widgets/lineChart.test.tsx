import { LineChart } from '../../src/widgets/lineChart';
import { render } from '@testing-library/react';

describe('LineChart', () => {
  const baseProps = {
    data: [{ month: 'Jan', revenue: 100 }, { month: 'Feb', revenue: 150 }],
    xAxisKey: 'month',
    yAxisKeys: ['revenue'],
    title: 'Monthly Revenue',
    description: 'Revenue trend'
  };

  it('renders with data', () => {
    const { container } = render(<LineChart {...baseProps} />);
    expect(container.textContent).toContain('Monthly Revenue');
    expect(container.textContent).toContain('Revenue trend');
  });

  it('shows empty state when no data', () => {
    const { container } = render(<LineChart {...baseProps} data={[]} />);
    expect(container.textContent).toContain('No data available');
  });

  it('renders multiple series', () => {
    const multiProps = { ...baseProps, yAxisKeys: ['revenue', 'profit'] };
    const { container } = render(<LineChart {...multiProps} />);
    expect(container.textContent).toContain('Monthly Revenue');
  });

  it('handles groupKey', () => {
    const groupProps = { ...baseProps, groupKey: 'segment' };
    const { container } = render(<LineChart {...groupProps} />);
    expect(container.textContent).toContain('Monthly Revenue');
  });
});