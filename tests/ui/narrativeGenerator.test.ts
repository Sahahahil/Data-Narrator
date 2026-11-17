import { generateNarrative } from '../../src/ui/narrativeGenerator.tsx';
import { render } from '@testing-library/react';

describe('generateNarrative', () => {
  it('formats description in prose div', () => {
    const result = generateNarrative("Revenue up 20%");
    const { container } = render(result);
    expect(container.querySelector('.prose')).toBeInTheDocument();
    expect(container.textContent).toContain("Revenue up 20%");
  });

  it('handles empty string', () => {
    const result = generateNarrative("");
    const { container } = render(result);
    expect(container.querySelector('.prose')).toBeInTheDocument();
  });
});