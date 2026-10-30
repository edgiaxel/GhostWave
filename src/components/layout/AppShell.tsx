import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomPlayer } from './BottomPlayer';
import { ToastContainer } from '../common/ToastContainer';
import { QueueModal } from '../common/QueueModal';
import { ScanModal } from '../common/ScanModal';
import { AddToPlaylistModal } from '../common/AddToPlaylistModal';
import { MetadataEditModal } from '../common/MetadataEditModal';
import { NowPlayingDrawer } from '../common/NowPlayingDrawer';
import { OnlineEnrichmentModal } from '../common/OnlineEnrichmentModal';
import { AudioConversionModal } from '../common/AudioConversionModal';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    togglePlayPause,
    nextTrack,
    prevTrack,
    layout,
    enrichmentModalTrack,
    setEnrichmentModalTrack,
    conversionModalTracks,
    setConversionModalTracks,
  } = useApp();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting inputs or textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.altKey && e.code === 'ArrowRight') {
        e.preventDefault();
        nextTrack();
      } else if (e.altKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        prevTrack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, nextTrack, prevTrack]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-surface text-on-surface flex flex-col font-body relative">
      <Header />
      <Sidebar />

      {/* Main Content Area: fixed viewport bounds with independent scrolling */}
      <div
        style={{
          top: `${layout.headerHeight}px`,
          bottom: `${layout.bottomPlayerHeight}px`,
          left: `${layout.sidebarWidth}px`,
        }}
        className="fixed right-0 overflow-y-auto flex flex-col transition-all duration-75"
      >
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-7 flex flex-col max-w-7xl mx-auto pb-10">
          {children}
        </main>
      </div>

      {/* Slide-Up Audio Visualizer & Queue Drawer */}
      <NowPlayingDrawer />

      <BottomPlayer />
      <ToastContainer />
      <QueueModal />
      <ScanModal />
      <AddToPlaylistModal />
      <MetadataEditModal />
      <OnlineEnrichmentModal
        track={enrichmentModalTrack}
        onClose={() => setEnrichmentModalTrack(null)}
      />
      {conversionModalTracks.length > 0 && (
        <AudioConversionModal
          tracksToConvert={conversionModalTracks}
          onClose={() => setConversionModalTracks([])}
        />
      )}
    </div>
  );
};
