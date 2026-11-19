// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorFallback } from './ErrorFallback';

describe('ErrorFallback', () => {
  it('announces the failure and retries through the handler it is given', () => {
    const onRetry = vi.fn();
    render(<ErrorFallback onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument();
  });

  it('carries its own colours instead of era tokens', () => {
    const { container } = render(<ErrorFallback onRetry={() => {}} />);
    expect(container.innerHTML).not.toContain('--era-');
    expect(container.querySelector('main')?.getAttribute('style')).toContain('background');
  });
});
