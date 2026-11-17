import { ResponsiveContainer } from '../../src/widgets/responsiveContainer';
import { render } from '@testing-library/react';

describe('ResponsiveContainer', () => {
  it('renders children with default width and height', () => {
    const { container } = render(
      <ResponsiveContainer>
        <div data-testid="child">Child</div>
      </ResponsiveContainer>
    );
    expect(container.querySelector('[data-testid="child"]')).toBeInTheDocument();
  });

  it('applies custom width and height', () => {
    const { container } = render(
      <ResponsiveContainer width="50%" height="300px">
        <div data-testid="child">Child</div>
      </ResponsiveContainer>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('50%');
    expect(wrapper.style.height).toBe('300px');
  });
});