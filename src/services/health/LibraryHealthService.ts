import { Track, LibraryIssue, MetadataProposal } from '../../types';

export interface HealthReport {
  issues: LibraryIssue[];
  proposals: MetadataProposal[];
  stats: {
    totalTracks: number;
    healthyTracks: number;
    missingTagsCount: number;
    inconsistentNamingCount: number;
    exactDuplicatesCount: number;
    metadataDuplicatesCount: number;
  };
}

export class LibraryHealthService {
  /**
   * Deterministically analyze library tracks for missing tags, inconsistent naming,
   * exact file duplicates, and possible metadata duplicates.
   */
  static analyze(tracks: Track[], renamePattern = '{artist} - {title}'): HealthReport {
    const issues: LibraryIssue[] = [];
    const proposals: MetadataProposal[] = [];

    const tracksWithIssues = new Set<string>();

    // 1. Missing Tags Analysis
    for (const track of tracks) {
      const missingFields: string[] = [];

      // Check if title is missing or equals raw filename
      const rawBaseName = track.fileName.replace(/\.[^/.]+$/, '');
      const hasGenericTitle =
        !track.title ||
        track.title.trim() === '' ||
        track.title === track.fileName ||
        track.title === rawBaseName;

      if (hasGenericTitle) missingFields.push('title');
      if (!track.artist || track.artist.trim() === '' || track.artist.toLowerCase() === 'unknown artist') {
        missingFields.push('artist');
      }
      if (!track.album || track.album.trim() === '' || track.album.toLowerCase() === 'unknown album') {
        missingFields.push('album');
      }

      if (missingFields.length > 0) {
        tracksWithIssues.add(track.id);
        issues.push({
          id: `issue-tags-${track.id}`,
          trackId: track.id,
          issueType: 'missing_tags',
          severity: missingFields.includes('title') || missingFields.includes('artist') ? 'medium' : 'low',
          description: `Missing audio tag information: ${missingFields.join(', ')}.`,
          details: { missingFields, fileName: track.fileName },
          suggestedAction: 'Edit track metadata or extract from filename pattern.',
        });

        // Generate heuristic proposal if filename contains " - " separator
        if (track.fileName.includes(' - ')) {
          const parts = rawBaseName.split(' - ');
          if (parts.length >= 2) {
            const proposedArtist = parts[0].trim();
            const proposedTitle = parts.slice(1).join(' - ').trim();

            if (hasGenericTitle && proposedTitle) {
              proposals.push({
                id: `prop-title-${track.id}`,
                trackId: track.id,
                field: 'title',
                currentValue: track.title,
                proposedValue: proposedTitle,
                source: 'filename_heuristic',
                confidence: 0.85,
                status: 'pending',
              });
            }

            if ((!track.artist || track.artist === 'Unknown Artist') && proposedArtist) {
              proposals.push({
                id: `prop-artist-${track.id}`,
                trackId: track.id,
                field: 'artist',
                currentValue: track.artist,
                proposedValue: proposedArtist,
                source: 'filename_heuristic',
                confidence: 0.85,
                status: 'pending',
              });
            }
          }
        }
      }
    }

    // 2. Inconsistent Naming Pattern Analysis
    for (const track of tracks) {
      const rawBaseName = track.fileName.replace(/\.[^/.]+$/, '');
      const ext = track.fileName.includes('.') ? track.fileName.slice(track.fileName.lastIndexOf('.')) : '';

      // Clean expected filename based on known tags
      const safeArtist = track.artist && track.artist !== 'Unknown Artist' ? track.artist : '';
      const safeTitle = track.title && track.title !== track.fileName ? track.title : '';

      if (safeArtist && safeTitle) {
        const expectedBaseName = renamePattern
          .replace('{artist}', safeArtist)
          .replace('{title}', safeTitle)
          .replace('{album}', track.album || '')
          .replace('{trackNumber}', track.trackNumber ? String(track.trackNumber).padStart(2, '0') : '');

        // Check if current name diverges significantly (e.g. underscores, missing artist prefix)
        const isMismatched =
          rawBaseName.includes('_') ||
          rawBaseName.toLowerCase() !== expectedBaseName.toLowerCase();

        if (isMismatched && !rawBaseName.startsWith(`${safeArtist} - ${safeTitle}`)) {
          tracksWithIssues.add(track.id);
          issues.push({
            id: `issue-name-${track.id}`,
            trackId: track.id,
            issueType: 'inconsistent_naming',
            severity: 'low',
            description: `Filename "${track.fileName}" does not match standard pattern "${renamePattern}${ext}".`,
            details: { current: track.fileName, expectedPattern: renamePattern },
            suggestedAction: 'Apply naming template to standardize file naming.',
          });
        }
      }
    }

    // 3. Exact Duplicates Analysis (matching file size and duration)
    const exactGroups = new Map<string, Track[]>();
    for (const track of tracks) {
      if (track.fileSizeBytes > 0 && track.durationSeconds > 0) {
        const key = `${track.fileSizeBytes}_${Math.round(track.durationSeconds)}_${track.format}`;
        const group = exactGroups.get(key) || [];
        group.push(track);
        exactGroups.set(key, group);
      }
    }

    let exactDuplicatesCount = 0;
    for (const [, group] of exactGroups.entries()) {
      if (group.length > 1) {
        exactDuplicatesCount += group.length - 1;
        for (let i = 1; i < group.length; i++) {
          const duplicate = group[i];
          const original = group[0];
          tracksWithIssues.add(duplicate.id);
          issues.push({
            id: `issue-exact-${duplicate.id}`,
            trackId: duplicate.id,
            issueType: 'potential_duplicate',
            severity: 'high',
            description: `Exact binary match with "${original.fileName}" (${original.title}).`,
            details: {
              duplicateId: duplicate.id,
              originalId: original.id,
              originalFileName: original.fileName,
              isExact: true,
            },
            suggestedAction: 'Remove duplicate record from library index.',
          });
        }
      }
    }

    // 4. Metadata Duplicates Analysis (matching artist and title across different file sizes)
    const metaGroups = new Map<string, Track[]>();
    for (const track of tracks) {
      const normArtist = track.artist?.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const normTitle = track.title?.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      if (normArtist && normTitle && normArtist !== 'unknownartist') {
        const key = `${normArtist}::${normTitle}`;
        const group = metaGroups.get(key) || [];
        group.push(track);
        metaGroups.set(key, group);
      }
    }

    let metadataDuplicatesCount = 0;
    for (const [, group] of metaGroups.entries()) {
      if (group.length > 1) {
        // Exclude if already flagged as exact duplicate
        const nonExact = group.filter((t, idx) => {
          if (idx === 0) return true;
          return !issues.some((iss) => iss.trackId === t.id && iss.details?.isExact);
        });

        if (nonExact.length > 1) {
          metadataDuplicatesCount += nonExact.length - 1;
          for (let i = 1; i < nonExact.length; i++) {
            const duplicate = nonExact[i];
            const original = nonExact[0];
            tracksWithIssues.add(duplicate.id);
            issues.push({
              id: `issue-meta-${duplicate.id}`,
              trackId: duplicate.id,
              issueType: 'potential_duplicate',
              severity: 'medium',
              description: `Similar metadata: duplicate title "${duplicate.title}" by "${duplicate.artist}". Different format or encode (${duplicate.format} vs ${original.format}).`,
              details: {
                duplicateId: duplicate.id,
                originalId: original.id,
                originalFileName: original.fileName,
                isExact: false,
              },
              suggestedAction: 'Review track details to keep preferred audio quality.',
            });
          }
        }
      }
    }

    const missingTagsCount = issues.filter((i) => i.issueType === 'missing_tags').length;
    const inconsistentNamingCount = issues.filter((i) => i.issueType === 'inconsistent_naming').length;
    const healthyTracks = Math.max(0, tracks.length - tracksWithIssues.size);

    return {
      issues,
      proposals,
      stats: {
        totalTracks: tracks.length,
        healthyTracks,
        missingTagsCount,
        inconsistentNamingCount,
        exactDuplicatesCount,
        metadataDuplicatesCount,
      },
    };
  }
}
