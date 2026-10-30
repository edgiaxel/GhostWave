import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MetadataEditService, RenamePreviewItem } from '../services/health/MetadataEditService';

export const HealthCleanupScreen: React.FC = () => {
  const {
    tracks,
    libraryIssues,
    metadataProposals,
    approveProposal,
    rejectProposal,
    applyApprovedProposals,
    applyRenameTemplate,
    removeTrackFromLibrary,
    setEditTrackModal,
    runHealthCheck,
    settings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'renaming'>('overview');
  const [issueFilter, setIssueFilter] = useState<'all' | 'missing_tags' | 'inconsistent_naming' | 'potential_duplicate'>('all');

  // Renaming Template State
  const [templatePattern, setTemplatePattern] = useState(settings.library.renamePattern || '{artist} - {title}');
  const [isApplyingRenames, setIsApplyingRenames] = useState(false);

  // Compute live rename previews
  const renamePreviews: RenamePreviewItem[] = useMemo(() => {
    return MetadataEditService.generateRenamePreview(tracks, templatePattern);
  }, [tracks, templatePattern]);

  const validRenamesCount = renamePreviews.filter((p) => p.status === 'valid').length;
  const collisionCount = renamePreviews.filter((p) => p.status === 'collision').length;
  const missingFieldCount = renamePreviews.filter((p) => p.status === 'missing_field').length;

  // Filter issues
  const filteredIssues = useMemo(() => {
    if (issueFilter === 'all') return libraryIssues;
    return libraryIssues.filter((i) => i.issueType === issueFilter);
  }, [libraryIssues, issueFilter]);

  const pendingProposalsCount = metadataProposals.filter((p) => p.status === 'pending').length;
  const approvedProposalsCount = metadataProposals.filter((p) => p.status === 'approved').length;

  const handleApplyAllApproved = async () => {
    await applyApprovedProposals();
  };

  const handleApplyRenames = async () => {
    setIsApplyingRenames(true);
    await applyRenameTemplate(templatePattern);
    setIsApplyingRenames(false);
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            Health & Cleanup
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Safe non-destructive metadata correction, duplicate detection, and file renaming
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => runHealthCheck()}
            className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors border border-outline-variant/30 flex items-center gap-1.5"
            title="Re-run health analysis on local library"
          >
            <span className="material-symbols-outlined text-base text-primary">sync</span>
            <span>Run Health Audit</span>
          </button>
          <button
            onClick={handleApplyAllApproved}
            className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">check</span>
            <span>Apply Approved ({approvedProposalsCount})</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] text-on-surface-variant font-medium">Total Tracks</span>
          <span className="font-headline font-bold text-xl text-on-surface">{tracks.length}</span>
          <span className="text-[10px] text-outline font-mono">Indexed locally</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] text-on-surface-variant font-medium">Library Issues</span>
          <span className={`font-headline font-bold text-xl ${libraryIssues.length > 0 ? 'text-tertiary' : 'text-secondary'}`}>
            {libraryIssues.length}
          </span>
          <span className="text-[10px] text-outline font-mono">
            {libraryIssues.length === 0 ? 'Optimal health' : 'Needs attention'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] text-on-surface-variant font-medium">Tag Proposals</span>
          <span className="font-headline font-bold text-xl text-primary">{pendingProposalsCount}</span>
          <span className="text-[10px] text-outline font-mono">Awaiting your approval</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] text-on-surface-variant font-medium">Standardizer Ready</span>
          <span className="font-headline font-bold text-xl text-on-surface">{validRenamesCount}</span>
          <span className="text-[10px] text-outline font-mono">Matches rename template</span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-primary/15 text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-base">rule</span>
          <span>Detected Issues</span>
          <span className="text-[11px] opacity-75">({libraryIssues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'proposals'
              ? 'bg-primary/15 text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-base">difference</span>
          <span>Proposed Tag Diffs</span>
          <span className="text-[11px] opacity-75">({metadataProposals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('renaming')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'renaming'
              ? 'bg-primary/15 text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-base">drive_file_rename_outline</span>
          <span>Naming Template &amp; Rename</span>
        </button>
      </div>

      {/* TAB 1: DETECTED ISSUES */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setIssueFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                issueFilter === 'all'
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Issues ({libraryIssues.length})
            </button>
            <button
              onClick={() => setIssueFilter('missing_tags')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                issueFilter === 'missing_tags'
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Missing Tags ({libraryIssues.filter((i) => i.issueType === 'missing_tags').length})
            </button>
            <button
              onClick={() => setIssueFilter('inconsistent_naming')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                issueFilter === 'inconsistent_naming'
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Inconsistent Naming ({libraryIssues.filter((i) => i.issueType === 'inconsistent_naming').length})
            </button>
            <button
              onClick={() => setIssueFilter('potential_duplicate')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                issueFilter === 'potential_duplicate'
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Duplicates ({libraryIssues.filter((i) => i.issueType === 'potential_duplicate').length})
            </button>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col items-center justify-center text-center gap-3">
              <span className="material-symbols-outlined text-4xl text-secondary">verified</span>
              <p className="text-sm font-semibold text-on-surface">
                Zero library defects or pending proposals detected.
              </p>
              <p className="text-xs text-on-surface-variant max-w-md">
                Your collection contains complete audio tags, standard filename structures, and zero detected duplicate files.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredIssues.map((issue) => {
                const trk = tracks.find((t) => t.id === issue.trackId);
                return (
                  <div
                    key={issue.id}
                    className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5 shrink-0">
                        {issue.issueType === 'missing_tags'
                          ? 'label_off'
                          : issue.issueType === 'potential_duplicate'
                          ? 'content_copy'
                          : 'format_paint'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-headline font-semibold text-xs text-on-surface capitalize truncate">
                            {issue.issueType.replace(/_/g, ' ')}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              issue.severity === 'high'
                                ? 'bg-error/10 text-error'
                                : issue.severity === 'medium'
                                ? 'bg-tertiary/20 text-tertiary'
                                : 'bg-surface-container text-outline'
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium truncate mt-1">
                          {trk?.title || trk?.fileName || issue.trackId}
                        </p>
                        <p className="text-[11px] text-outline mt-1 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15 text-xs">
                      <span className="font-mono text-[10px] text-outline truncate max-w-[140px]">
                        {trk?.fileName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {issue.issueType === 'potential_duplicate' ? (
                          <button
                            onClick={() => removeTrackFromLibrary(issue.trackId)}
                            className="px-2.5 py-1 rounded-lg bg-error/10 hover:bg-error/20 text-error text-xs font-medium transition-colors"
                            title="Remove duplicate index entry"
                          >
                            Remove Duplicate
                          </button>
                        ) : trk ? (
                          <button
                            onClick={() => setEditTrackModal(trk)}
                            className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-primary/20 transition-colors"
                          >
                            Edit Tags
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROPOSED TAG DIFFS */}
      {activeTab === 'proposals' && (
        <div className="rounded-2xl bg-surface-container-low border border-outline-variant/20 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-headline font-semibold text-sm text-on-surface">
                Proposed Tag Diffs
              </h2>
              <p className="text-[11px] text-outline">
                Review and approve tag corrections extracted from filename heuristics before application
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-surface-container text-secondary font-mono text-[11px] font-semibold">
                {pendingProposalsCount} Pending
              </span>
              <button
                onClick={handleApplyAllApproved}
                disabled={approvedProposalsCount === 0}
                className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
              >
                Apply Approved ({approvedProposalsCount})
              </button>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs" aria-label="Metadata Proposals Table">
            <thead className="bg-surface-container/40 text-outline text-[11px] font-medium border-b border-outline-variant/20">
              <tr>
                <th className="py-3 px-4">Track / File</th>
                <th className="py-3 px-4">Field</th>
                <th className="py-3 px-4">Current Value</th>
                <th className="py-3 px-4">Proposed Value</th>
                <th className="py-3 px-4 hidden sm:table-cell">Confidence</th>
                <th className="py-3 px-4 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {metadataProposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-on-surface-variant font-medium">
                    Zero library defects or pending proposals detected.
                  </td>
                </tr>
              ) : (
                metadataProposals.map((prop) => {
                  const trk = tracks.find((t) => t.id === prop.trackId);
                  return (
                    <tr key={prop.id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col min-w-0 max-w-[200px]">
                          <span className="font-medium text-on-surface truncate">
                            {trk?.title || 'Unknown Title'}
                          </span>
                          <span className="text-[10px] text-outline font-mono truncate">
                            {trk?.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs uppercase font-semibold text-primary">
                        {prop.field}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-error/10 text-error font-mono text-xs line-through">
                          {String(prop.currentValue || '(empty)')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-mono text-xs font-semibold">
                          {String(prop.proposedValue)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 hidden sm:table-cell font-mono text-xs text-outline">
                        {Math.round(prop.confidence * 100)}%
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {prop.status === 'applied' ? (
                          <span className="inline-flex items-center gap-1 text-secondary font-mono text-xs font-semibold">
                            <span className="material-symbols-outlined text-sm">task_alt</span>
                            Applied
                          </span>
                        ) : prop.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-primary font-mono text-xs font-semibold">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Approved
                          </span>
                        ) : prop.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-outline font-mono text-xs">
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            Rejected
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => approveProposal(prop.id)}
                              className="px-3 py-1 rounded-full bg-secondary/20 hover:bg-secondary/30 text-secondary text-xs font-semibold transition-colors"
                              title="Approve this proposed change"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectProposal(prop.id)}
                              className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface text-xs transition-colors"
                              title="Reject this proposed change"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: FILENAME RENAMING TEMPLATE */}
      {activeTab === 'renaming' && (
        <div className="flex flex-col gap-5">
          {/* Template Configuration Card */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col gap-1">
              <h2 className="font-headline font-bold text-base text-on-surface">
                Filename Standardizer
              </h2>
              <p className="text-xs text-on-surface-variant">
                Preview and apply uniform naming patterns without overwriting or destroying original audio data.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label htmlFor="rename-template-input" className="text-xs font-semibold text-on-surface-variant">
                  Naming Pattern Template
                </label>
                <input
                  id="rename-template-input"
                  type="text"
                  value={templatePattern}
                  onChange={(e) => setTemplatePattern(e.target.value)}
                  placeholder="{artist} - {title}"
                  className="bg-surface-container border border-outline-variant/40 rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyRenames}
                  disabled={isApplyingRenames || validRenamesCount === 0}
                  className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:opacity-90 disabled:opacity-40 transition-all shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">drive_file_rename_outline</span>
                  <span>Apply Standardized Names ({validRenamesCount})</span>
                </button>
              </div>
            </div>

            {/* Template Variables Legend */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-outline pt-2 border-t border-outline-variant/15">
              <span className="font-medium text-on-surface">Available tokens:</span>
              <button
                type="button"
                onClick={() => setTemplatePattern((prev) => `${prev} {artist}`)}
                className="px-2 py-0.5 rounded bg-surface-container font-mono text-primary hover:bg-surface-container-high transition-colors"
              >
                {'{artist}'}
              </button>
              <button
                type="button"
                onClick={() => setTemplatePattern((prev) => `${prev} {title}`)}
                className="px-2 py-0.5 rounded bg-surface-container font-mono text-primary hover:bg-surface-container-high transition-colors"
              >
                {'{title}'}
              </button>
              <button
                type="button"
                onClick={() => setTemplatePattern((prev) => `${prev} {album}`)}
                className="px-2 py-0.5 rounded bg-surface-container font-mono text-primary hover:bg-surface-container-high transition-colors"
              >
                {'{album}'}
              </button>
              <button
                type="button"
                onClick={() => setTemplatePattern((prev) => `${prev} {trackNumber}`)}
                className="px-2 py-0.5 rounded bg-surface-container font-mono text-primary hover:bg-surface-container-high transition-colors"
              >
                {'{trackNumber}'}
              </button>
              <button
                type="button"
                onClick={() => setTemplatePattern((prev) => `${prev} {year}`)}
                className="px-2 py-0.5 rounded bg-surface-container font-mono text-primary hover:bg-surface-container-high transition-colors"
              >
                {'{year}'}
              </button>
            </div>

            {/* Warnings Alert */}
            {(collisionCount > 0 || missingFieldCount > 0) && (
              <div className="p-3 rounded-xl bg-tertiary/10 border border-tertiary/30 text-xs text-on-surface flex items-start gap-2.5">
                <span className="material-symbols-outlined text-tertiary text-base mt-0.5">warning</span>
                <div>
                  <span className="font-semibold text-tertiary">Notice:</span>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {collisionCount > 0 && `${collisionCount} potential collision(s) detected. `}
                    {missingFieldCount > 0 && `${missingFieldCount} track(s) lack required metadata for this template. `}
                    Conflicting and missing-field files will be safely skipped.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Rename Preview Table */}
          <div className="rounded-2xl bg-surface-container-low border border-outline-variant/20 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
              <h3 className="font-headline font-semibold text-sm text-on-surface">
                Rename Preview &amp; Collision Audit
              </h3>
              <span className="text-xs text-outline font-mono">
                {validRenamesCount} of {tracks.length} eligible
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs" aria-label="Rename Previews Table">
              <thead className="bg-surface-container/40 text-outline text-[11px] font-medium border-b border-outline-variant/20">
                <tr>
                  <th className="py-3 px-4">Current Filename</th>
                  <th className="py-3 px-4">Proposed Filename</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {renamePreviews.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-on-surface-variant font-medium">
                      No tracks in library to rename.
                    </td>
                  </tr>
                ) : (
                  renamePreviews.map((item) => {
                    const trk = tracks.find((t) => t.id === item.trackId);
                    return (
                      <tr key={item.trackId} className="hover:bg-surface-container/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-outline truncate max-w-[220px]">
                          {item.currentFileName}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-on-surface truncate max-w-[260px]">
                          {item.proposedFileName}
                        </td>
                        <td className="py-3 px-4">
                          {item.status === 'valid' ? (
                            <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-mono text-[10px] font-semibold">
                              Ready
                            </span>
                          ) : item.status === 'unchanged' ? (
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-outline font-mono text-[10px]">
                              Unchanged
                            </span>
                          ) : item.status === 'collision' ? (
                            <span className="px-2 py-0.5 rounded-full bg-error/15 text-error font-mono text-[10px] font-semibold" title={item.reason}>
                              Collision
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary font-mono text-[10px] font-semibold" title={item.reason}>
                              {item.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {trk && (
                            <button
                              onClick={() => setEditTrackModal(trk)}
                              className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors"
                            >
                              Edit Tags
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
