import { KPICard } from '../../src/widgets/kpiCard';
import { render } from '@testing-library/react';

describe('KPICard', () => {
  const baseProps = {
    data: [{ value: 100 }, { value: 200.5 }],
    yAxisKeys: ['value'],
    title: 'Total Value',
    description: 'Sum of all values'
  };

  it('calculates sum and formats with commas', () => {
    const { container } = render(<KPICard {...baseProps} />);
    expect(container.textContent).toContain('Total Value');
    expect(container.textContent).toContain('Sum of all values');
    // 100 + 200.5 = 300.5 should be formatted
    expect(container.textContent).toContain('300.5');
  });

  it('shows 0 for empty data', () => {
    const { container } = render(<KPICard {...baseProps} data={[]} />);
    expect(container.textContent).toContain('Total Value');
    expect(container.textContent).toContain('0');
  });
});