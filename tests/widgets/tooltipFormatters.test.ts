import { formatLineTooltip, formatBarTooltip, formatScatterTooltip } from '../../src/widgets/tooltipFormatters.tsx';
import { render } from '@testing-library/react';

describe('TooltipFormatters', () => {
  describe('formatLineTooltip()', () => {
    it('returns tooltip with label and series values', () => {
      const payload = [{ month: 'Jan', name: 'revenue', value: 100 }];
      const result = formatLineTooltip(payload, 'month');
      const { container } = render(result);
      expect(container.textContent).toContain('Jan');
      expect(container.textContent).toContain('revenue: 100');
    });
  });

  describe('formatBarTooltip()', () => {
    it('returns tooltip with category and values', () => {
      const payload = [{ name: 'Category A', value: 100 }];
      const result = formatBarTooltip(payload);
      const { container } = render(result);
      expect(container.textContent).toContain('Category A');
      expect(container.textContent).toContain('100');
    });
  });

  describe('formatScatterTooltip()', () => {
    it('returns tooltip with X and Y values', () => {
      const payload = [{ payload: { x: 10, y: 20 } }];
      const result = formatScatterTooltip(payload);
      const { container } = render(result);
      expect(container.textContent).toContain('X: 10');
      expect(container.textContent).toContain('Y: 20');
    });
  });
});