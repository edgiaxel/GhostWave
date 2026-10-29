import React from 'react';
import { useApp } from '../context/AppContext';

export const ListeningHistoryScreen: React.FC = () => {
  const { tracks, addToast } = useApp();

  const handleClearHistory = () => {
    addToast({
      title: 'History Cleared',
      message: 'Local listening history has been reset.',
      type: 'info',
    });
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            Listening History & Trends
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Private offline listening statistics
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-xs text-error font-medium transition-colors border border-outline-variant/20 self-start sm:self-auto"
        >
          Clear History
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-outline font-medium">Total Plays</span>
          <span className="font-headline font-bold text-3xl text-primary mt-1">128</span>
          <span className="text-[11px] text-on-surface-variant">5 tracks</span>
        </div>
        <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-outline font-medium">Time Listened</span>
          <span className="font-headline font-bold text-3xl text-secondary mt-1">6h 42m</span>
          <span className="text-[11px] text-on-surface-variant">Lossless sessions</span>
        </div>
        <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-outline font-medium">Top Genre</span>
          <span className="font-headline font-bold text-3xl text-tertiary mt-1">Horror Synth</span>
          <span className="text-[11px] text-on-surface-variant">John Carpenter</span>
        </div>
      </div>

      {/* Recent Tracks List */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 flex flex-col gap-3 shadow-sm">
        <span className="text-xs font-semibold text-on-surface">
          Recently Played
        </span>
        <div className="flex flex-col divide-y divide-outline-variant/10">
          {tracks.map((trk, i) => (
            <div key={trk.id} className="py-3 px-2 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <span className="font-mono text-xs text-outline w-4 text-center">{i + 1}</span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">{trk.title}</span>
                  <span className="text-[11px] text-on-surface-variant">{trk.artist}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 font-mono text-xs text-outline">
                <span>{32 - i * 6} plays</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
