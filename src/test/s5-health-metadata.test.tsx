import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';
import { HealthCleanupScreen } from '../screens/HealthCleanupScreen';
import { MetadataEditModal } from '../components/common/MetadataEditModal';
import { ToastContainer } from '../components/common/ToastContainer';
import { LibraryHealthService } from '../services/health/LibraryHealthService';
import { MetadataEditService } from '../services/health/MetadataEditService';
import { IndexedDbRepository } from '../services/storage/IndexedDbRepository';
import { Track, Playlist } from '../types';

describe('S5: Library Health, Metadata Editing, and Safe Renaming Tests', () => {
  let repository: IndexedDbRepository;

  const mockTracks: Track[] = [
    {
      id: 'track-healthy',
      filePath: '/music/Ghost Trio - Spectral Dance.mp3',
      fileName: 'Ghost Trio - Spectral Dance.mp3',
      fileSizeBytes: 5000,
      lastModified: 1700000000000,
      format: 'mp3',
      title: 'Spectral Dance',
      artist: 'Ghost Trio',
      album: 'Phantom Ballroom',
      genre: ['Darkwave'],
      year: 2024,
      trackNumber: 1,
      durationSeconds: 180,
      hasEmbeddedPicture: true,
      availability: 'available',
      addedAt: 1000,
    },
    {
      id: 'track-missing-tags',
      filePath: '/music/spooky_waltz_raw.mp3',
      fileName: 'spooky_waltz_raw.mp3',
      fileSizeBytes: 3000,
      lastModified: 1700000000000,
      format: 'mp3',
      title: 'spooky_waltz_raw', // generic filename title
      artist: 'Unknown Artist',
      album: '',
      genre: [],
      durationSeconds: 120,
      hasEmbeddedPicture: false,
      availability: 'available',
      addedAt: 2000,
    },
    {
      id: 'track-inconsistent-name',
      filePath: '/music/cyber_wraith_neon_ghost_v2.flac',
      fileName: 'cyber_wraith_neon_ghost_v2.flac',
      fileSizeBytes: 8000,
      lastModified: 1700000000000,
      format: 'flac',
      title: 'Neon Ghost',
      artist: 'Cyber Wraith',
      album: 'Haunted Circuit',
      genre: ['Synthwave'],
      year: 2025,
      trackNumber: 2,
      durationSeconds: 240,
      hasEmbeddedPicture: true,
      availability: 'available',
      addedAt: 3000,
    },
    {
      id: 'track-exact-duplicate-1',
      filePath: '/music/Banshee - Fog Echo.wav',
      fileName: 'Banshee - Fog Echo.wav',
      fileSizeBytes: 12000,
      lastModified: 1700000000000,
      format: 'wav',
      title: 'Fog Echo',
      artist: 'Banshee',
      album: 'Mist',
      genre: ['Ambient'],
      durationSeconds: 60,
      hasEmbeddedPicture: false,
      availability: 'available',
      addedAt: 4000,
    },
    {
      id: 'track-exact-duplicate-2',
      filePath: '/music/copy/Banshee - Fog Echo (1).wav',
      fileName: 'Banshee - Fog Echo (1).wav',
      fileSizeBytes: 12000, // Exact same size and duration
      lastModified: 1700000000000,
      format: 'wav',
      title: 'Fog Echo',
      artist: 'Banshee',
      album: 'Mist',
      genre: ['Ambient'],
      durationSeconds: 60,
      hasEmbeddedPicture: false,
      availability: 'available',
      addedAt: 5000,
    },
    {
      id: 'track-meta-duplicate-flac',
      filePath: '/music/spectral_dance_remaster.flac',
      fileName: 'spectral_dance_remaster.flac',
      fileSizeBytes: 24000, // Different size and format, but identical artist and title
      lastModified: 1700000000000,
      format: 'flac',
      title: 'Spectral Dance',
      artist: 'Ghost Trio',
      album: 'Phantom Ballroom (Lossless)',
      genre: ['Darkwave'],
      durationSeconds: 180,
      hasEmbeddedPicture: true,
      availability: 'available',
      addedAt: 6000,
    },
  ];

  beforeEach(async () => {
    repository = new IndexedDbRepository();
    await repository.clearLibrary();
    await repository.saveTracks(mockTracks);
  });

  describe('S5.1: Deterministic Library Health Service', () => {
    it('detects missing tags, inconsistent naming patterns, exact duplicates, and metadata duplicates', () => {
      const report = LibraryHealthService.analyze(mockTracks, '{artist} - {title}');

      // 1. Missing tags detection
      const missingTagIssues = report.issues.filter((i) => i.issueType === 'missing_tags');
      expect(missingTagIssues.some((i) => i.trackId === 'track-missing-tags')).toBe(true);

      // 2. Inconsistent naming detection
      const namingIssues = report.issues.filter((i) => i.issueType === 'inconsistent_naming');
      expect(namingIssues.some((i) => i.trackId === 'track-inconsistent-name')).toBe(true);

      // 3. Exact duplicates detection
      const exactDupIssues = report.issues.filter((i) => i.issueType === 'potential_duplicate' && i.details?.isExact);
      expect(exactDupIssues.length).toBeGreaterThan(0);
      expect(exactDupIssues[0].trackId).toBe('track-exact-duplicate-2');

      // 4. Metadata duplicates detection
      const metaDupIssues = report.issues.filter((i) => i.issueType === 'potential_duplicate' && !i.details?.isExact);
      expect(metaDupIssues.some((i) => i.trackId === 'track-meta-duplicate-flac')).toBe(true);

      // 5. Stats accuracy
      expect(report.stats.totalTracks).toBe(6);
      expect(report.stats.exactDuplicatesCount).toBe(1);
      expect(report.stats.metadataDuplicatesCount).toBe(1);
    });
  });

  describe('S5.2: Manual Metadata Editing & Validation', () => {
    it('validates metadata input properly and rejects blank required fields or invalid years', () => {
      const invalidBlankTitle = MetadataEditService.validate({ title: '   ' });
      expect(invalidBlankTitle.valid).toBe(false);
      expect(invalidBlankTitle.errors.title).toBeDefined();

      const invalidBlankArtist = MetadataEditService.validate({ artist: '' });
      expect(invalidBlankArtist.valid).toBe(false);
      expect(invalidBlankArtist.errors.artist).toBeDefined();

      const invalidYear = MetadataEditService.validate({ year: 1500 });
      expect(invalidYear.valid).toBe(false);
      expect(invalidYear.errors.year).toBeDefined();

      const validUpdate = MetadataEditService.validate({
        title: 'Haunted Symphony',
        artist: 'Ghost Orchestra',
        year: 2024,
        trackNumber: 5,
      });
      expect(validUpdate.valid).toBe(true);
    });

    it('applies metadata updates non-destructively while preserving immutable identity attributes', () => {
      const originalTrack = mockTracks[0];
      const result = MetadataEditService.applyMetadata(originalTrack, {
        title: 'Spectral Dance (VIP Mix)',
        year: 2026,
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Spectral Dance (VIP Mix)');
      expect(result.data?.year).toBe(2026);
      // Immutable properties preserved
      expect(result.data?.id).toBe(originalTrack.id);
      expect(result.data?.format).toBe(originalTrack.format);
      expect(result.data?.filePath).toBe(originalTrack.filePath);
    });
  });

  describe('S5.3: Naming Templates & Safe Rename Preview', () => {
    it('previews filenames from template and flags missing fields', () => {
      const previews = MetadataEditService.generateRenamePreview(mockTracks, '{artist} - {title}');

      // Healthy track
      const healthyPreview = previews.find((p) => p.trackId === 'track-healthy');
      expect(healthyPreview?.proposedFileName).toBe('Ghost Trio - Spectral Dance.mp3');
      expect(healthyPreview?.status).toBe('unchanged');

      // Inconsistent track (eligible for rename)
      const renamePreview = previews.find((p) => p.trackId === 'track-inconsistent-name');
      expect(renamePreview?.proposedFileName).toBe('Cyber Wraith - Neon Ghost.flac');
      expect(renamePreview?.status).toBe('valid');

      // Missing tags track lacks artist
      const missingPreview = previews.find((p) => p.trackId === 'track-missing-tags');
      expect(missingPreview?.status).toBe('missing_field');
    });

    it('detects collisions and invalid filesystem characters', () => {
      const tracksWithCollision: Track[] = [
        { ...mockTracks[0], id: 'c-1', fileName: 'one.mp3' },
        { ...mockTracks[0], id: 'c-2', fileName: 'two.mp3' }, // Same artist & title
      ];

      const previews = MetadataEditService.generateRenamePreview(tracksWithCollision, '{artist} - {title}');
      expect(previews[0].status).toBe('collision');
      expect(previews[1].status).toBe('collision');

      // Invalid character template
      const invalidCharPreviews = MetadataEditService.generateRenamePreview(
        [mockTracks[0]],
        '{artist} / {title} : {year}'
      );
      expect(invalidCharPreviews[0].status).toBe('invalid_characters');
    });
  });

  describe('S5.4: UI Integration, Approval Workflows & Preservation', () => {
    it('requires explicit user approval before applying proposed tag diffs', async () => {
      // Seed a track with a clear "Artist - Title" filename that produces a heuristic proposal
      const heuristicTrack: Track = {
        id: 'track-heuristic',
        filePath: '/music/Haunted DJ - Midnight Pulse.mp3',
        fileName: 'Haunted DJ - Midnight Pulse.mp3',
        fileSizeBytes: 4000,
        lastModified: 1700000000000,
        format: 'mp3',
        title: 'Haunted DJ - Midnight Pulse',
        artist: 'Unknown Artist',
        album: '',
        genre: [],
        durationSeconds: 150,
        hasEmbeddedPicture: false,
        availability: 'available',
        addedAt: Date.now(),
      };
      await repository.clearLibrary();
      await repository.saveTracks([heuristicTrack]);

      const { unmount } = render(
        <AppProvider>
          <HealthCleanupScreen />
          <ToastContainer />
        </AppProvider>
      );

      // Switch to Proposed Tag Diffs tab
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Proposed Tag Diffs/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /Proposed Tag Diffs/i }));

      // Proposals should appear with Approve button
      await waitFor(() => {
        expect(screen.getByText('Midnight Pulse')).toBeInTheDocument();
      });

      // Click Approve on proposal
      const approveButtons = screen.getAllByRole('button', { name: /^Approve$/i });
      fireEvent.click(approveButtons[0]);

      // State changes to Approved in the table row
      await waitFor(() => {
        expect(within(screen.getByRole('table')).getByText('Approved')).toBeInTheDocument();
      });

      // Apply approved
      const applyBtns = screen.getAllByRole('button', { name: /Apply Approved \(1\)/i });
      fireEvent.click(applyBtns[0]);

      // Verify applied badge in the table
      await waitFor(() => {
        expect(within(screen.getByRole('table')).getByText('Applied')).toBeInTheDocument();
      });

      unmount();
    });

    it('edits metadata manually and preserves playlist track references', async () => {
      // Seed track and a playlist pointing to it
      const sampleTrack = mockTracks[0];
      const samplePlaylist: Playlist = {
        id: 'pl-ref-check',
        name: 'Darkwave Essentials',
        trackIds: [sampleTrack.id],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await repository.clearLibrary();
      await repository.saveTracks([sampleTrack]);
      await repository.savePlaylist(samplePlaylist);

      const TestHarness = () => {
        const { tracks, playlists, setEditTrackModal } = useApp();
        return (
          <div>
            <span data-testid="track-title">{tracks[0]?.title}</span>
            <span data-testid="playlist-track-count">{playlists[0]?.trackIds.length}</span>
            <button
              onClick={() => setEditTrackModal(tracks[0])}
              aria-label="Open Edit Modal"
            >
              Open Edit
            </button>
            <MetadataEditModal />
          </div>
        );
      };

      const { unmount } = render(
        <AppProvider>
          <TestHarness />
          <ToastContainer />
        </AppProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('track-title')).toHaveTextContent('Spectral Dance');
      });

      // Open edit modal
      fireEvent.click(screen.getByLabelText('Open Edit Modal'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Change Title
      const titleInput = screen.getByLabelText(/Track Title/i);
      fireEvent.change(titleInput, { target: { value: 'Spectral Dance (2026 Remaster)' } });

      // Save
      fireEvent.click(screen.getByRole('button', { name: /Save Metadata/i }));

      // Dialog dismisses and updated title appears
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByTestId('track-title')).toHaveTextContent('Spectral Dance (2026 Remaster)');
        // Playlist reference preserved!
        expect(screen.getByTestId('playlist-track-count')).toHaveTextContent('1');
      });

      unmount();
    });
  });
});
