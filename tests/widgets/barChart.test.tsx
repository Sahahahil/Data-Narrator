import { BarChart } from '../../src/widgets/barChart';
import { render } from '@testing-library/react';

describe('BarChart', () => {
  const baseProps = {
    data: [{ category: 'A', value: 100 }, { category: 'B', value: 150 }],
    xAxisKey: 'category',
    yAxisKeys: ['value'],
    title: 'Category Values',
    description: 'Values by category'
  };

  it('renders with data', () => {
    const { container } = render(<BarChart {...baseProps} />);
    expect(container.textContent).toContain('Category Values');
    expect(container.textContent).toContain('Values by category');
  });

  it('shows empty state when no data', () => {
    const { container } = render(<BarChart {...baseProps} data={[]} />);
    expect(container.textContent).toContain('No data available');
  });

  it('handles groupKey for grouped bars', () => {
    const groupProps = { ...baseProps, groupKey: 'segment' };
    const { container } = render(<BarChart {...groupProps} />);
    expect(container.textContent).toContain('Category Values');
  });
});