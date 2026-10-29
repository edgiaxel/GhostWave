import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const QueueModal: React.FC = () => {
  const { activeModal, setActiveModal, tracks, playbackState, playTrack } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };
    if (activeModal === 'queue-drawer') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, setActiveModal]);

  if (activeModal !== 'queue-drawer') return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="queue-modal-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full max-w-md h-full bg-surface-container-low border-l border-outline-variant/40 p-5 flex flex-col justify-between shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">playlist_play</span>
              <h2 id="queue-modal-title" className="font-headline font-semibold text-base text-on-surface">
                Current Playback Queue
              </h2>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container"
              aria-label="Close queue drawer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs text-outline uppercase tracking-wider">
              Tracks in Queue ({tracks.length})
            </span>
            {tracks.map((track, idx) => {
              const isCurrent = track.id === playbackState.currentTrackId;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track.id)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') playTrack(track.id);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded cursor-pointer transition-colors ${
                    isCurrent
                      ? 'bg-surface-container-high border-l-2 border-primary'
                      : 'hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-outline w-4 text-center">
                      {idx + 1}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-medium truncate ${isCurrent ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                        {track.title}
                      </span>
                      <span className="text-[11px] text-on-surface-variant truncate">
                        {track.artist}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-outline ml-2">
                    {Math.floor(track.durationSeconds / 60)}:{(track.durationSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/30 flex justify-end">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-xs font-medium text-on-surface transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
