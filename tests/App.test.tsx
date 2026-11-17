// tests/App.test.tsx
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App (Phase 1)', () => {
  it('renders file upload zone', () => {
    render(<App />);
    expect(screen.getByLabelText(/upload zone/i)).toBeInTheDocument();
  });
  it('shows drag-drop area for CSV/Parquet', () => {
    render(<App />);
    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
  });
});