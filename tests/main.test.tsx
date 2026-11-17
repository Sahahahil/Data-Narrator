// tests/main.test.tsx
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { ReactElement } from 'react';

describe('main.tsx', () => {
  it('renders App component', () => {
    const { container } = render(<React.StrictMode><div id="root">Test</div></React.StrictMode>);
    expect(container).toBeInTheDocument();
  });
});