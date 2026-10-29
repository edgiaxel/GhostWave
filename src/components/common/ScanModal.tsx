import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export const ScanModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectAndImportFiles,
    selectAndImportFolder,
    importAudioFiles,
  } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleStart = async () => {
    setActiveModal(null);
    if (isFolder) {
      await selectAndImportFolder();
    } else {
      await selectAndImportFiles();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setActiveModal(null);
      await importAudioFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleManualFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setActiveModal(null);
      await importAudioFiles(Array.from(e.target.files));
    }
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
        className="w-full max-w-lg bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">
                {isFolder ? 'folder_open' : 'library_add'}
              </span>
            </div>
            <div className="flex flex-col">
              <h2 id="scan-modal-title" className="font-headline font-semibold text-base text-on-surface">
                {isFolder ? 'Scan Music Folder' : 'Import Local Audio Files'}
              </h2>
              <span className="text-xs text-outline font-medium">
                FLAC, MP3, WAV, OGG, M4A, AAC
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="w-8 h-8 rounded-full text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
            isDragging
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline-variant/30 hover:border-primary/50 bg-surface-container/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".mp3,.flac,.ogg,.wav,.m4a,.aac,.opus,audio/*"
            className="hidden"
            onChange={handleManualFileInput}
          />
          <span className="material-symbols-outlined text-3xl text-primary">
            upload_file
          </span>
          <span className="text-xs font-medium text-on-surface">
            Drag and drop audio files here, or click to browse
          </span>
          <span className="text-[11px] text-outline">
            Metadata, duration, and album art are extracted locally offline
          </span>
        </div>

        {/* Security / Privacy notice */}
        <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-secondary text-base shrink-0">
            lock
          </span>
          <span className="text-xs text-on-surface-variant">
            Files remain strictly on your local disk. Audio data is never uploaded.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/20">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">
              {isFolder ? 'folder_open' : 'add'}
            </span>
            <span>{isFolder ? 'Choose Folder' : 'Select Files'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
