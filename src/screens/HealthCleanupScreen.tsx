import React from 'react';
import { useApp } from '../context/AppContext';

export const HealthCleanupScreen: React.FC = () => {
  const {
    libraryIssues,
    metadataProposals,
    approveProposal,
    rejectProposal,
    addToast,
  } = useApp();

  const handleApplyAll = () => {
    const approvedCount = metadataProposals.filter((p) => p.status === 'approved').length;
    if (approvedCount === 0) {
      addToast({
        title: 'No Changes Approved',
        message: 'Review and approve at least one proposal before applying.',
        type: 'warning',
      });
      return;
    }

    addToast({
      title: 'Safe Diff Applied',
      message: `Updated ${approvedCount} metadata fields in local index.`,
      type: 'success',
    });
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
            Safe non-destructive metadata correction & duplicate detection
          </p>
        </div>

        <button
          onClick={handleApplyAll}
          className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">check</span>
          <span>Apply Approved</span>
        </button>
      </div>

      {/* Detected Issues */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {libraryIssues.map((issue) => (
          <div
            key={issue.id}
            className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between gap-3 shadow-sm"
          >
            <div className="flex items-start gap-2.5">
              <span
                className={`material-symbols-outlined text-lg mt-0.5 ${
                  issue.severity === 'high'
                    ? 'text-error'
                    : issue.severity === 'medium'
                    ? 'text-tertiary'
                    : 'text-outline'
                }`}
              >
                {issue.severity === 'high' ? 'error' : 'info'}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-on-surface capitalize">
                  {issue.issueType.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-on-surface-variant mt-0.5">
                  {issue.description}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between font-mono text-[10px]">
              <span className="text-outline">{issue.suggestedAction}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full uppercase font-semibold ${
                  issue.severity === 'high'
                    ? 'bg-error/15 text-error'
                    : 'bg-tertiary/15 text-tertiary'
                }`}
              >
                {issue.severity}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-Side Diff Table */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-surface-container/40 border-b border-outline-variant/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-on-surface">
            Proposed Tag Diffs
          </span>
          <span className="text-[11px] text-outline font-mono">
            Requires explicit user confirmation
          </span>
        </div>

        <table className="w-full text-left text-xs" aria-label="Metadata Proposals Diff Table">
          <thead className="bg-surface-container/20 text-outline text-[11px] font-medium border-b border-outline-variant/20">
            <tr>
              <th className="py-3 px-4">Field</th>
              <th className="py-3 px-4">Current Value</th>
              <th className="py-3 px-4">Proposed Value</th>
              <th className="py-3 px-4 hidden sm:table-cell">Confidence</th>
              <th className="py-3 px-4 text-right">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {metadataProposals.map((prop) => (
              <tr key={prop.id} className="hover:bg-surface-container/40 transition-colors">
                <td className="py-3.5 px-4 font-mono text-xs uppercase font-medium text-on-surface">
                  {prop.field}
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-error/10 text-error font-mono text-xs line-through">
                    {String(prop.currentValue)}
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
                  {prop.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1 text-secondary font-mono text-xs font-semibold">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
