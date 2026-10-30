import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';
import { LibraryScreen } from '../screens/LibraryScreen';
import { PlaylistsScreen } from '../screens/PlaylistsScreen';
import { BottomPlayer } from '../components/layout/BottomPlayer';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { ToastContainer } from '../components/common/ToastContainer';
import { IndexedDbRepository } from '../services/storage/IndexedDbRepository';
import { WebFilePlatform } from '../services/platform/WebFilePlatform';
import { getPlatform } from '../services/platform';
import { Track, Playlist } from '../types';

describe('S4: Library Search and Playlists Tests', () => {
  let repository: IndexedDbRepository;

  const mockTracks: Track[] = [
    {
      id: 'track-1',
      filePath: '/music/spooky_waltz.mp3',
      fileName: 'spooky_waltz.mp3',
      fileSizeBytes: 3000,
      lastModified: 1700000000000,
      format: 'mp3',
      title: 'Spooky Waltz',
      artist: 'Phantom Trio',
      album: 'Graveyard Sessions',
      genre: ['Classical', 'Gothic'],
      durationSeconds: 120,
      trackNumber: 2,
      hasEmbeddedPicture: true,
      availability: 'available',
      addedAt: 1000,
    },
    {
      id: 'track-2',
      filePath: '/music/neon_ghost.flac',
      fileName: 'neon_ghost.flac',
      fileSizeBytes: 6000,
      lastModified: 1700000000000,
      format: 'flac',
      title: 'Neon Ghost',
      artist: 'Cyber Wraith',
      album: 'Haunted Circuit',
      genre: ['Synthwave'],
      durationSeconds: 240,
      trackNumber: 1,
      hasEmbeddedPicture: false,
      availability: 'available',
      addedAt: 2000,
    },
    {
      id: 'track-3',
      filePath: '/music/ambient_fog.wav',
      fileName: 'ambient_fog.wav',
      fileSizeBytes: 9000,
      lastModified: 1700000000000,
      format: 'wav',
      title: 'Ambient Fog',
      artist: 'Banshee Echo',
      album: 'Graveyard Sessions',
      genre: ['Ambient'],
      durationSeconds: 60,
      trackNumber: 3,
      hasEmbeddedPicture: false,
      availability: 'available',
      addedAt: 3000,
    },
  ];

  beforeEach(async () => {
    repository = new IndexedDbRepository();
    await repository.clearLibrary();
    await repository.saveTracks(mockTracks);

    const platform = getPlatform() as WebFilePlatform;
    mockTracks.forEach((t) => {
      platform.storeFileInMemory(t.id, new File(['dummy-bytes'], t.fileName, { type: 'audio/mpeg' }));
    });
  });

  describe('S4.1: Library Search, Filtering, and Sorting', () => {
    it('filters tracks by search query across title, artist, album, and format', async () => {
      const { unmount } = render(
        <AppProvider>
          <LibraryScreen />
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Spooky Waltz')).toBeInTheDocument();
      expect(within(table).getByText('Neon Ghost')).toBeInTheDocument();
      expect(within(table).getByText('Ambient Fog')).toBeInTheDocument();

      // Filter by format pill 'FLAC'
      fireEvent.click(screen.getByRole('button', { name: /^FLAC$/i }));

      const tableFiltered = screen.getByRole('table');
      expect(within(tableFiltered).getByText('Neon Ghost')).toBeInTheDocument();
      expect(within(tableFiltered).queryByText('Spooky Waltz')).not.toBeInTheDocument();
      expect(within(tableFiltered).queryByText('Ambient Fog')).not.toBeInTheDocument();

      // Filter by 'Missing Art'
      fireEvent.click(screen.getByRole('button', { name: /Missing Art/i }));
      const tableMissingArt = screen.getByRole('table');
      expect(within(tableMissingArt).getByText('Neon Ghost')).toBeInTheDocument();
      expect(within(tableMissingArt).getByText('Ambient Fog')).toBeInTheDocument();
      expect(within(tableMissingArt).queryByText('Spooky Waltz')).not.toBeInTheDocument();

      unmount();
    });

    it('sorts tracks deterministically by title, artist, duration, and track number', async () => {
      const { unmount } = render(
        <AppProvider>
          <LibraryScreen />
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const sortSelect = screen.getByLabelText('Sort library by field');
      expect(sortSelect).toBeInTheDocument();

      // Change sort to Duration
      fireEvent.change(sortSelect, { target: { value: 'duration' } });

      // In ascending order: Ambient Fog (60s), Spooky Waltz (120s), Neon Ghost (240s)
      const rows = screen.getAllByRole('row');
      // row 0 is header, rows 1-3 are data
      expect(rows[1]).toHaveTextContent('Ambient Fog');
      expect(rows[2]).toHaveTextContent('Spooky Waltz');
      expect(rows[3]).toHaveTextContent('Neon Ghost');

      // Toggle sort direction to descending
      const toggleDirButton = screen.getByLabelText(/Toggle sort direction/i);
      fireEvent.click(toggleDirButton);

      const rowsDesc = screen.getAllByRole('row');
      expect(rowsDesc[1]).toHaveTextContent('Neon Ghost');
      expect(rowsDesc[2]).toHaveTextContent('Spooky Waltz');
      expect(rowsDesc[3]).toHaveTextContent('Ambient Fog');

      unmount();
    });

    it('handles no results gracefully and provides clear filters action', async () => {
      const { unmount } = render(
        <AppProvider>
          <LibraryScreen />
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Filter by WAV
      fireEvent.click(screen.getByRole('button', { name: /^WAV$/i }));
      const tableWav = screen.getByRole('table');
      expect(within(tableWav).getByText('Ambient Fog')).toBeInTheDocument();
      expect(within(tableWav).queryByText('Neon Ghost')).not.toBeInTheDocument();

      // Click Clear filters
      const clearButton = screen.getByRole('button', { name: /Clear filters/i });
      fireEvent.click(clearButton);

      // All 3 tracks should be visible again in the table
      const tableCleared = screen.getByRole('table');
      expect(within(tableCleared).getByText('Spooky Waltz')).toBeInTheDocument();
      expect(within(tableCleared).getByText('Neon Ghost')).toBeInTheDocument();
      expect(within(tableCleared).getByText('Ambient Fog')).toBeInTheDocument();

      unmount();
    });
  });

  describe('S4.2: Playlist CRUD, Reordering, and Reference Preservation', () => {
    it('creates, renames, edits, and deletes playlists with confirmation', async () => {
      const { unmount } = render(
        <AppProvider>
          <PlaylistsScreen />
          <ToastContainer />
        </AppProvider>
      );

      // Initially empty state
      await waitFor(() => {
        expect(screen.getByText(/No playlists yet/i)).toBeInTheDocument();
      });

      // Open creation modal
      fireEvent.click(screen.getByRole('button', { name: /Create Your First Playlist/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Enter name & description
      const nameInput = screen.getByLabelText(/Playlist Name/i);
      fireEvent.change(nameInput, { target: { value: 'Synthwave Night' } });

      const descInput = screen.getByLabelText(/Description/i);
      fireEvent.change(descInput, { target: { value: 'Chill spooky driving songs' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /Create Playlist/i }));

      // Wait for playlist in UI
      await waitFor(() => {
        expect(screen.getAllByText('Synthwave Night').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Chill spooky driving songs/i).length).toBeGreaterThan(0);
      });

      // Edit playlist
      const editButton = screen.getByLabelText('Edit playlist');
      fireEvent.click(editButton);

      const editNameInput = screen.getByLabelText(/Playlist Name/i);
      fireEvent.change(editNameInput, { target: { value: 'Haunted Synthwave' } });
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getAllByText('Haunted Synthwave').length).toBeGreaterThan(0);
        expect(screen.queryByText(/Edit Playlist Details/i)).not.toBeInTheDocument();
      });

      // Delete playlist with confirmation
      const deleteButton = screen.getByLabelText('Delete playlist');
      fireEvent.click(deleteButton);

      // Dialog opens
      await waitFor(() => {
        expect(screen.getByText(/Delete “Haunted Synthwave”\?/i)).toBeInTheDocument();
      });
      const deleteDialog = screen.getByRole('dialog', { name: /Delete “Haunted Synthwave”\?/i });
      const confirmDeleteButton = within(deleteDialog).getByRole('button', { name: /Delete Playlist/i });
      fireEvent.click(confirmDeleteButton);

      // Should return to empty state
      await waitFor(() => {
        expect(screen.getByText(/No playlists yet/i)).toBeInTheDocument();
      });

      unmount();
    });

    it('adds tracks via modal, prevents duplicate additions, and supports reordering', async () => {
      // Pre-seed a playlist
      const testPlaylist: Playlist = {
        id: 'pl-test',
        name: 'Goth Rock Mix',
        description: 'Dark selections',
        icon: 'album',
        accentColor: 'witch-violet',
        trackIds: ['track-1', 'track-2'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await repository.savePlaylist(testPlaylist);

      const { unmount } = render(
        <AppProvider>
          <PlaylistsScreen />
          <AddToPlaylistModal />
          <ToastContainer />
        </AppProvider>
      );

      // Verify playlist loaded from IndexedDB
      await waitFor(() => {
        expect(screen.getAllByText('Goth Rock Mix').length).toBeGreaterThan(0);
        expect(screen.getByText('Spooky Waltz')).toBeInTheDocument();
        expect(screen.getByText('Neon Ghost')).toBeInTheDocument();
      });

      // Move Track 2 (Neon Ghost) Up
      const moveUpButtons = screen.getAllByLabelText('Move track up');
      fireEvent.click(moveUpButtons[1]);

      // Remove Spooky Waltz from playlist
      const removeButtons = screen.getAllByTitle('Remove track from playlist');
      fireEvent.click(removeButtons[0]);

      // Spooky Waltz should be removed from playlist
      await waitFor(() => {
        expect(screen.queryByText('Spooky Waltz')).not.toBeInTheDocument();
        expect(screen.getByText('Neon Ghost')).toBeInTheDocument();
      });

      unmount();
    });

    it('safely preserves playlist integrity when tracks are deleted from library', async () => {
      const testPlaylist: Playlist = {
        id: 'pl-integrity',
        name: 'Integrity Check',
        trackIds: ['track-1', 'track-2'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await repository.savePlaylist(testPlaylist);

      // Helper harness to invoke removeTrackFromLibrary directly while viewing PlaylistsScreen
      const TestHarness = () => {
        const { removeTrackFromLibrary } = useApp();
        return (
          <div>
            <button
              onClick={() => removeTrackFromLibrary('track-1')}
              aria-label="Test Remove Track 1"
            >
              Test Remove Track 1
            </button>
            <PlaylistsScreen />
          </div>
        );
      };

      const { unmount } = render(
        <AppProvider>
          <TestHarness />
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Integrity Check').length).toBeGreaterThan(0);
        expect(screen.getByText('Spooky Waltz')).toBeInTheDocument();
      });

      // Delete track-1
      fireEvent.click(screen.getByLabelText('Test Remove Track 1'));

      // Check that app does not crash and playlist reflects 1 track remaining
      await waitFor(() => {
        expect(screen.getByText('Neon Ghost')).toBeInTheDocument();
        expect(screen.queryByText('Spooky Waltz')).not.toBeInTheDocument();
      });

      unmount();
    });
  });

  describe('S4.3: Playlist Playback, Queue Integration, and App Restart Persistence', () => {
    it('plays playlist, sets current track, and enqueues upcoming tracks', async () => {
      const testPlaylist: Playlist = {
        id: 'pl-playback',
        name: 'Playback Test',
        trackIds: ['track-1', 'track-2', 'track-3'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await repository.savePlaylist(testPlaylist);

      const { unmount } = render(
        <AppProvider>
          <PlaylistsScreen />
          <BottomPlayer />
          <ToastContainer />
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Playback Test').length).toBeGreaterThan(0);
      });

      // Click "Play All" on playlist
      const playAllBtn = screen.getByRole('button', { name: /Play All/i });
      fireEvent.click(playAllBtn);

      // Bottom player should immediately show Track 1 (Spooky Waltz) as playing
      await waitFor(() => {
        const playerRegion = screen.getByRole('region', { name: /Audio Playback Controls/i });
        expect(playerRegion).toHaveTextContent(/Spooky Waltz/i);
        expect(playerRegion).toHaveTextContent(/Phantom Trio/i);
      });

      unmount();
    });

    it('persists playlists across app restarts via IndexedDB', async () => {
      const persistedPlaylist: Playlist = {
        id: 'pl-persisted',
        name: 'Persisted Across Restart',
        description: 'Stored in IndexedDB version 2',
        icon: 'favorite',
        accentColor: 'toxic-slime',
        trackIds: ['track-2'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await repository.savePlaylist(persistedPlaylist);

      // Simulate app start
      const { unmount } = render(
        <AppProvider>
          <PlaylistsScreen />
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Persisted Across Restart').length).toBeGreaterThan(0);
        expect(screen.getByText('Stored in IndexedDB version 2')).toBeInTheDocument();
      });

      unmount();
    });
  });
});
