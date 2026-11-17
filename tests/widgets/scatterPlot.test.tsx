import { ScatterPlot } from '../../src/widgets/scatterPlot';
import { render } from '@testing-library/react';

describe('ScatterPlot', () => {
  const baseProps = {
    data: [{ x: 10, y: 20 }, { x: 15, y: 30 }],
    xAxisKey: 'x',
    yAxisKeys: ['y'],
    title: 'X vs Y',
    description: 'Correlation'
  };

  it('renders with data', () => {
    const { container } = render(<ScatterPlot {...baseProps} />);
    expect(container.textContent).toContain('X vs Y');
    expect(container.textContent).toContain('Correlation');
  });

  it('shows empty state when no data', () => {
    const { container } = render(<ScatterPlot {...baseProps} data={[]} />);
    expect(container.textContent).toContain('No data available');
  });
});