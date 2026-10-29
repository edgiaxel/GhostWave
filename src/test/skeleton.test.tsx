import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import { App } from '../App';

const renderApp = () => {
  return render(
    <AppProvider>
      <App />
    </AppProvider>
  );
};

describe('S1 Modular Application Skeleton Smoke Tests', () => {
  it('renders the core shell with header, sidebar deck navigation, and bottom player', () => {
    renderApp();

    // Verify Brand
    expect(screen.getByText('GhostWave')).toBeInTheDocument();

    // Verify Main Sidebar Navigation items scoped within navigation
    const nav = screen.getByRole('navigation', { name: /Main Navigation/i });
    expect(within(nav).getByRole('button', { name: /Library/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /Playlists/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /Health & Cleanup/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /Audio Visualizer/i })).toBeInTheDocument();

    const toolsNav = screen.getByRole('navigation', { name: /Tools Navigation/i });
    expect(within(toolsNav).getByRole('button', { name: /Local AI Assistant/i })).toBeInTheDocument();
    expect(within(toolsNav).getByRole('button', { name: /Listening History/i })).toBeInTheDocument();
    expect(within(toolsNav).getByRole('button', { name: /Settings & Platform/i })).toBeInTheDocument();

    // Verify Bottom Player Controls
    expect(screen.getByRole('region', { name: /Audio Playback Controls/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Start playback/i)).toBeInTheDocument();
  });

  it('navigates seamlessly across all deck modules without breaking shared shell', () => {
    renderApp();
    const nav = screen.getByRole('navigation', { name: /Main Navigation/i });
    const toolsNav = screen.getByRole('navigation', { name: /Tools Navigation/i });

    // 1. Library Screen (default)
    expect(screen.getByText('Featured Album')).toBeInTheDocument();

    // 2. Playlists Screen
    fireEvent.click(within(nav).getByRole('button', { name: /Playlists/i }));
    expect(screen.getByRole('heading', { level: 1, name: /Playlists & Smart Crates/i })).toBeInTheDocument();

    // 3. Health & Cleanup Screen
    fireEvent.click(within(nav).getByRole('button', { name: /Health & Cleanup/i }));
    expect(screen.getByRole('heading', { level: 1, name: /Health & Cleanup/i })).toBeInTheDocument();
    expect(screen.getByText('Proposed Tag Diffs')).toBeInTheDocument();

    // 4. Audio Visualizer Screen
    fireEvent.click(within(nav).getByRole('button', { name: /Audio Visualizer/i }));
    expect(screen.getByText('Live Visualizer')).toBeInTheDocument();
    expect(screen.getByText('Ghost Pulse')).toBeInTheDocument();

    // 5. Local AI Assistant Screen
    fireEvent.click(within(toolsNav).getByRole('button', { name: /Local AI Assistant/i }));
    expect(screen.getByRole('heading', { level: 1, name: /Local AI Assistant/i })).toBeInTheDocument();

    // 6. Listening History Screen
    fireEvent.click(within(toolsNav).getByRole('button', { name: /Listening History/i }));
    expect(screen.getByRole('heading', { level: 1, name: /Listening History & Trends/i })).toBeInTheDocument();

    // 7. Settings & Platform Screen
    fireEvent.click(within(toolsNav).getByRole('button', { name: /Settings & Platform/i }));
    expect(screen.getByRole('heading', { level: 1, name: /Settings & Platform/i })).toBeInTheDocument();
    expect(screen.getByText('Appearance & Themes')).toBeInTheDocument();
  });

  it('toggles theme between Halloween Dark and Halloween Light and persists to html element', () => {
    renderApp();

    const themeToggleBtn = screen.getByLabelText(/Switch theme/i);
    expect(themeToggleBtn).toBeInTheDocument();

    // Initially Halloween Dark
    expect(document.documentElement).toHaveClass('dark');

    // Toggle to Light
    fireEvent.click(themeToggleBtn);
    expect(document.documentElement).toHaveClass('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('halloween-light');

    // Toggle back to Dark
    fireEvent.click(themeToggleBtn);
    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('halloween-dark');
  });

  it('operates playback controls correctly', () => {
    renderApp();

    const playBtn = screen.getByLabelText(/Start playback/i);
    fireEvent.click(playBtn);

    // State updates to Pause
    expect(screen.getByLabelText(/Pause playback/i)).toBeInTheDocument();

    // Toggle back
    fireEvent.click(screen.getByLabelText(/Pause playback/i));
    expect(screen.getByLabelText(/Start playback/i)).toBeInTheDocument();
  });

  it('opens and closes the Queue drawer modal using keyboard Escape key', () => {
    renderApp();

    const queueBtn = screen.getByLabelText(/Open Playback Queue/i);
    fireEvent.click(queueBtn);

    expect(screen.getByText('Current Playback Queue')).toBeInTheDocument();

    // Press Escape to dismiss
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByText('Current Playback Queue')).not.toBeInTheDocument();
  });

  it('approves a metadata proposal and shows success feedback', () => {
    renderApp();
    const nav = screen.getByRole('navigation', { name: /Main Navigation/i });

    // Navigate to Health & Cleanup
    fireEvent.click(within(nav).getByRole('button', { name: /Health & Cleanup/i }));

    // Find the row approve button
    const approveBtn = screen.getAllByTitle('Approve this proposed change')[0];
    expect(approveBtn).toBeInTheDocument();

    fireEvent.click(approveBtn);
    expect(screen.getByText('Proposal Approved')).toBeInTheDocument();
  });
});
