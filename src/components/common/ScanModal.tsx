import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const ScanModal: React.FC = () => {
  const { activeModal, setActiveModal, triggerScan, addToast } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };
    if (activeModal === 'scan-folder' || activeModal === 'add-files') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, setActiveModal]);

  if (activeModal !== 'scan-folder' && activeModal !== 'add-files') return null;

  const isFolder = activeModal === 'scan-folder';

  const handleStart = () => {
    setActiveModal(null);
    triggerScan();
    addToast({
      title: isFolder ? 'Folder Scan Started' : 'Files Import Started',
      message: 'Scanning local audio tags, bitrates, and album artwork...',
      type: 'info',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full max-w-lg bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 flex flex-col gap-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">
                {isFolder ? 'folder_open' : 'note_add'}
              </span>
            </div>
            <div className="flex flex-col">
              <h2 id="scan-modal-title" className="font-headline font-semibold text-lg text-on-surface">
                {isFolder ? 'Scan Local Music Folder' : 'Import Local Audio Files'}
              </h2>
              <span className="font-mono text-xs text-outline">
                Platform File Adapter: Web File System / Tauri IPC
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="text-sm text-on-surface-variant flex flex-col gap-3">
          <p>
            {isFolder
              ? 'Select a folder containing FLAC, MP3, OGG, or WAV audio files. GhostWave will recursively inspect metadata, calculate durations, and detect missing tags offline.'
              : 'Pick one or more audio files from your local storage to index into your library.'}
          </p>

          <div className="p-3 rounded bg-surface-container border border-outline-variant/20 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-secondary text-lg mt-0.5">verified_user</span>
            <div className="text-xs text-on-surface-variant flex flex-col">
              <span className="font-medium text-on-surface">Safe Local Processing</span>
              <span>Audio files remain strictly on your device. GhostWave never uploads private audio files.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/30">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="px-4 py-2 rounded bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            <span>{isFolder ? 'Begin Folder Scan' : 'Import Files'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
