import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders editor route shell', async () => {
    window.history.pushState({}, '', '/editor');
    render(<App />);
    const heading = await screen.findByRole('heading', { name: 'Standalone Editor' });
    expect(heading).toBeTruthy();
  });
});
