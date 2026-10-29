import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomPlayer } from './BottomPlayer';
import { ToastContainer } from '../common/ToastContainer';
import { QueueModal } from '../common/QueueModal';
import { ScanModal } from '../common/ScanModal';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { togglePlayPause, nextTrack, prevTrack } = useApp();

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
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-body">
      <Header />
      <Sidebar />

      {/* Main Content Area */}
      <div className="pl-60 pt-16 pb-[76px] min-h-screen flex flex-col">
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-7 flex flex-col max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      <BottomPlayer />
      <ToastContainer />
      <QueueModal />
      <ScanModal />
    </div>
  );
};
