import { SkeletonLoader, LoadingSpinner, ErrorBoundary } from '../../src/ui/loadingStates.tsx';
import { render } from '@testing-library/react';

describe('LoadingStates', () => {
  describe('SkeletonLoader()', () => {
    it('returns chart-height div with bg-slate-800', () => {
      const result = SkeletonLoader();
      const { container } = render(result);
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveClass('h-64', 'w-full', 'bg-slate-800', 'rounded-xl');
    });
  });

  describe('LoadingSpinner()', () => {
    it('returns spinner div with animate-spin and border-blue-500', () => {
      const result = LoadingSpinner();
      const { container } = render(result);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('border-blue-500', 'border-t-transparent');
    });
  });

  describe('ErrorBoundary()', () => {
    it('returns error card with message and retry button', () => {
      const error = new Error("Test error");
      const result = ErrorBoundary({ error, onRetry: () => {} });
      const { container } = render(result);
      expect(container.textContent).toContain("Error");
      expect(container.textContent).toContain("Test error");
      expect(container.querySelector('button')).toHaveTextContent("Retry");
    });
  });
});