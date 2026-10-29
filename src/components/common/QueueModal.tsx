import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const QueueModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    tracks,
    playbackState,
    queue,
    removeFromQueue,
    moveQueueItem,
    clearQueue,
    playQueueItem,
  } = useApp();

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

  const currentTrack = tracks.find((t) => t.id === playbackState.currentTrackId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="queue-modal-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full max-w-md h-full bg-surface-container-low border-l border-outline-variant/30 p-5 flex flex-col justify-between shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">playlist_play</span>
              <h2 id="queue-modal-title" className="font-headline font-semibold text-base text-on-surface">
                Current Playback Queue
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-xs text-error font-medium transition-colors"
                  title="Clear all tracks from queue"
                >
                  Clear Queue
                </button>
              )}
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
                aria-label="Close queue drawer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {/* Now Playing section in Queue */}
          {currentTrack && (
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-primary font-semibold uppercase tracking-wider">
                Now Playing
              </span>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {currentTrack.pictureDataUrl ? (
                    <img
                      src={currentTrack.pictureDataUrl}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-base">music_note</span>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-on-surface truncate">
                      {currentTrack.title}
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      {currentTrack.artist}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-primary font-medium shrink-0">
                  {Math.floor(playbackState.currentTimeSeconds / 60)}:
                  {(Math.floor(playbackState.currentTimeSeconds) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          )}

          {/* Queue List */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-outline font-medium tracking-wide">
              Up Next ({queue.length})
            </span>

            {queue.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface-container/40 border border-outline-variant/20 flex flex-col items-center justify-center text-center gap-2">
                <span className="material-symbols-outlined text-3xl text-outline/60">queue_music</span>
                <span className="text-xs font-medium text-on-surface">Queue is empty</span>
                <span className="text-[11px] text-outline max-w-xs">
                  Click the queue icon on any track in your library to add it to the upcoming queue.
                </span>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-outline-variant/10">
                {queue.map((item, idx) => {
                  const track = tracks.find((t) => t.id === item.trackId);
                  if (!track) return null;

                  return (
                    <div
                      key={item.queueId}
                      className="py-2.5 px-2 rounded-xl flex items-center justify-between gap-2 hover:bg-surface-container/60 transition-colors group"
                    >
                      <div
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        onClick={() => playQueueItem(item.queueId)}
                      >
                        <span className="font-mono text-xs text-outline w-4 text-center">
                          {idx + 1}
                        </span>
                        {track.pictureDataUrl ? (
                          <img
                            src={track.pictureDataUrl}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-outline shrink-0">
                            <span className="material-symbols-outlined text-sm">music_note</span>
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-on-surface truncate">
                            {track.title}
                          </span>
                          <span className="text-[11px] text-on-surface-variant truncate">
                            {track.artist}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveQueueItem(idx, idx - 1)}
                          disabled={idx === 0}
                          className="w-6 h-6 rounded text-outline hover:text-on-surface disabled:opacity-20 flex items-center justify-center"
                          title="Move up in queue"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_upward</span>
                        </button>
                        <button
                          onClick={() => moveQueueItem(idx, idx + 1)}
                          disabled={idx === queue.length - 1}
                          className="w-6 h-6 rounded text-outline hover:text-on-surface disabled:opacity-20 flex items-center justify-center"
                          title="Move down in queue"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_downward</span>
                        </button>
                        <button
                          onClick={() => removeFromQueue(item.queueId)}
                          className="w-6 h-6 rounded text-outline hover:text-error flex items-center justify-center"
                          title="Remove from queue"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={() => setActiveModal(null)}
            className="px-5 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
