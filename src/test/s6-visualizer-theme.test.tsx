import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { LibraryScreen } from '../screens/LibraryScreen';
import { VisualizerScreen } from '../screens/VisualizerScreen';
import { PlaylistsScreen } from '../screens/PlaylistsScreen';
import { IndexedDbRepository } from '../services/storage/IndexedDbRepository';
import { Track, Playlist } from '../types';

describe('S6: Halloween Visualizer, Theme Polish & Layout Tests', () => {
  let repository: IndexedDbRepository;

  const mockTracks: Track[] = [
    {
      id: 'trk-1',
      filePath: '/music/Haunted Echoes.mp3',
      fileName: 'Haunted Echoes.mp3',
      fileSizeBytes: 5000,
      lastModified: 1700000000000,
      format: 'mp3',
      title: 'Haunted Echoes',
      artist: 'Spooky Duo',
      album: 'Phantom Crypt',
      genre: ['Darkwave'],
      durationSeconds: 180,
      hasEmbeddedPicture: false,
      availability: 'available',
      addedAt: Date.now() - 3000,
    },
    {
      id: 'trk-2',
      filePath: '/music/Cemetery Walk.flac',
      fileName: 'Cemetery Walk.flac',
      fileSizeBytes: 9000,
      lastModified: 1700000000000,
      format: 'flac',
      title: 'Cemetery Walk',
      artist: 'Wraith',
      album: 'Grave Beats',
      genre: ['Witch House'],
      durationSeconds: 210,
      hasEmbeddedPicture: false,
      availability: 'available',
      addedAt: Date.now() - 2000,
    },
    {
      id: 'trk-3',
      filePath: '/music/Midnight Cauldron.wav',
      fileName: 'Midnight Cauldron.wav',
      fileSizeBytes: 12000,
      lastModified: 1700000000000,
      format: 'wav',
      title: 'Midnight Cauldron',
      artist: 'Coven',
      album: 'Potions',
      genre: ['Ambient'],
      durationSeconds: 240,
      hasEmbeddedPicture: false,
      availability: 'available',
      addedAt: Date.now() - 1000,
    },
  ];

  beforeEach(async () => {
    localStorage.clear();
    repository = new IndexedDbRepository();
    await repository.clearLibrary();
    await repository.saveTracks(mockTracks);
  });

  describe('Fixed Resizable Layout & Element Limits', () => {
    it('initializes layout sizes and clamps updates within defined min and max limits', () => {
      const TestComponent = () => {
        const { layout, updateLayout } = useApp();
        return (
          <div>
            <span data-testid="header-height">{layout.headerHeight}</span>
            <span data-testid="sidebar-width">{layout.sidebarWidth}</span>
            <span data-testid="player-height">{layout.bottomPlayerHeight}</span>
            <button
              onClick={() => {
                // Try to set values beyond allowed limits:
                // header: min 52, max 84 -> test 30 and 150
                // sidebar: min 180, max 380 -> test 100 and 500
                // player: min 68, max 120 -> test 40 and 200
                updateLayout({
                  headerHeight: 20, // should clamp to 52
                  sidebarWidth: 500, // should clamp to 380
                  bottomPlayerHeight: 30, // should clamp to 68
                });
              }}
              data-testid="test-clamp-min-max"
            >
              Test Clamp
            </button>
            <button
              onClick={() => {
                updateLayout({
                  headerHeight: 120, // should clamp to 84
                  sidebarWidth: 120, // should clamp to 180
                  bottomPlayerHeight: 180, // should clamp to 120
                });
              }}
              data-testid="test-clamp-reverse"
            >
              Test Reverse Clamp
            </button>
          </div>
        );
      };

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Verify default sizes
      expect(screen.getByTestId('header-height')).toHaveTextContent('64');
      expect(screen.getByTestId('sidebar-width')).toHaveTextContent('240');
      expect(screen.getByTestId('player-height')).toHaveTextContent('76');

      // Test clamp 1
      fireEvent.click(screen.getByTestId('test-clamp-min-max'));
      expect(screen.getByTestId('header-height')).toHaveTextContent('52');
      expect(screen.getByTestId('sidebar-width')).toHaveTextContent('380');
      expect(screen.getByTestId('player-height')).toHaveTextContent('68');

      // Test clamp 2
      fireEvent.click(screen.getByTestId('test-clamp-reverse'));
      expect(screen.getByTestId('header-height')).toHaveTextContent('84');
      expect(screen.getByTestId('sidebar-width')).toHaveTextContent('180');
      expect(screen.getByTestId('player-height')).toHaveTextContent('120');
    });

    it('renders accessible resize handles for header, sidebar, and player', () => {
      render(
        <AppProvider>
          <AppShell>
            <div>Content</div>
          </AppShell>
        </AppProvider>
      );

      expect(screen.getByRole('separator', { name: /Resize Header Height/i })).toBeInTheDocument();
      expect(screen.getByRole('separator', { name: /Resize Sidebar Width/i })).toBeInTheDocument();
      expect(screen.getByRole('separator', { name: /Resize Bottom Player Height/i })).toBeInTheDocument();
    });
  });

  describe('Slide-Up Visualizer Drawer & Auto Queue Integration', () => {
    it('slides up when clicking toggle arrow and closes with collapse button', async () => {
      render(
        <AppProvider>
          <AppShell>
            <LibraryScreen />
          </AppShell>
        </AppProvider>
      );

      // Drawer is initially closed
      expect(screen.queryByRole('dialog', { name: /Now Playing Visualizer and Queue View/i })).not.toBeInTheDocument();

      // Find toggle button on bottom player
      const toggleBtn = screen.getByRole('button', { name: /Expand Visualizer & Queue/i });
      expect(toggleBtn).toBeInTheDocument();

      // Click to open slide-up visualizer
      fireEvent.click(toggleBtn);

      // Drawer appears
      expect(screen.getByRole('dialog', { name: /Now Playing Visualizer and Queue View/i })).toBeInTheDocument();
      expect(screen.getByText('Up Next Queue')).toBeInTheDocument();

      // Click collapse button inside drawer
      const collapseBtn = screen.getByRole('button', { name: /Collapse visualizer drawer/i });
      fireEvent.click(collapseBtn);

      // Drawer is closed
      expect(screen.queryByRole('dialog', { name: /Now Playing Visualizer and Queue View/i })).not.toBeInTheDocument();
    });

    it('automatically populates queue from library when playing a library track', async () => {
      render(
        <AppProvider>
          <AppShell>
            <LibraryScreen />
          </AppShell>
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Play first track ('Haunted Echoes') from table row
      const table = screen.getByRole('table');
      const trackRow = within(table).getByText('Haunted Echoes').closest('tr');
      expect(trackRow).toBeInTheDocument();
      fireEvent.click(trackRow!);

      // Open visualizer & queue drawer
      const toggleBtn = screen.getByRole('button', { name: /Expand Visualizer & Queue/i });
      fireEvent.click(toggleBtn);

      // The queue should now contain the upcoming tracks from the library ('Cemetery Walk' and 'Midnight Cauldron')
      await waitFor(() => {
        expect(screen.getByText('Up Next Queue')).toBeInTheDocument();
        expect(screen.getAllByText('Cemetery Walk').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Midnight Cauldron').length).toBeGreaterThan(0);
      });
    });

    it('automatically populates queue from playlist when playing a playlist track', async () => {
      // Seed a playlist with all 3 tracks
      const playlist: Playlist = {
        id: 'pl-spooky',
        name: 'Halloween Spooks',
        trackIds: ['trk-1', 'trk-2', 'trk-3'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await repository.savePlaylist(playlist);

      render(
        <AppProvider>
          <AppShell>
            <PlaylistsScreen />
          </AppShell>
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Halloween Spooks').length).toBeGreaterThan(0);
      });

      // Click Play All in playlist
      const playAllBtn = screen.getByRole('button', { name: /Play All/i });
      fireEvent.click(playAllBtn);

      // Open drawer
      const toggleBtn = screen.getByRole('button', { name: /Expand Visualizer & Queue/i });
      fireEvent.click(toggleBtn);

      // Current playing track is trk-1, upcoming queue contains trk-2 and trk-3
      await waitFor(() => {
        expect(screen.getAllByText('Cemetery Walk').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Midnight Cauldron').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Visualizer Customization & Halloween Themes', () => {
    it('supports visualizer presets and persists selection', async () => {
      render(
        <AppProvider>
          <VisualizerScreen />
        </AppProvider>
      );

      expect(screen.getByText('Ghost Pulse')).toBeInTheDocument();
      expect(screen.getByText('Spectral Bars')).toBeInTheDocument();
      expect(screen.getByText('Waveform Rings')).toBeInTheDocument();
      expect(screen.getByText('Pumpkin Pulse')).toBeInTheDocument();

      // Select Pumpkin Pulse
      fireEvent.click(screen.getByText('Pumpkin Pulse'));

      // Check persisted settings
      const rawSettings = localStorage.getItem('ghostwave_settings');
      expect(rawSettings).toBeDefined();
      const parsed = JSON.parse(rawSettings!);
      expect(parsed.visualizer.preset).toBe('pumpkin_pulse');
    });

    it('toggles themes cleanly and applies correct theme and accent dataset', () => {
      const ThemeTester = () => {
        const { settings, toggleTheme, updateSettings } = useApp();
        return (
          <div>
            <span data-testid="current-theme">{settings.theme}</span>
            <span data-testid="current-accent">{settings.accentPalette}</span>
            <button onClick={toggleTheme} data-testid="toggle-theme-btn">
              Toggle
            </button>
            <button
              onClick={() => updateSettings({ accentPalette: 'pumpkin-orange' })}
              data-testid="set-pumpkin-accent"
            >
              Set Pumpkin
            </button>
          </div>
        );
      };

      render(
        <AppProvider>
          <ThemeTester />
        </AppProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('halloween-dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('halloween-dark');

      // Toggle theme to light
      fireEvent.click(screen.getByTestId('toggle-theme-btn'));
      expect(screen.getByTestId('current-theme')).toHaveTextContent('halloween-light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('halloween-light');

      // Switch accent palette
      fireEvent.click(screen.getByTestId('set-pumpkin-accent'));
      expect(screen.getByTestId('current-accent')).toHaveTextContent('pumpkin-orange');
      expect(document.documentElement.getAttribute('data-accent')).toBe('pumpkin-orange');
    });
  });
});
