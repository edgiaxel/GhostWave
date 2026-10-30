import React from 'react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery, settings, toggleTheme, setRoute, layout, updateLayout } = useApp();

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = layout.headerHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      updateLayout({ headerHeight: startH + delta });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      updateLayout({ headerHeight: layout.headerHeight + 2 });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      updateLayout({ headerHeight: layout.headerHeight - 2 });
    }
  };

  return (
    <header
      role="banner"
      style={{ height: `${layout.headerHeight}px` }}
      className="fixed top-0 left-0 right-0 bg-surface-container-lowest/90 backdrop-blur-lg border-b border-outline-variant/20 z-50 flex items-center justify-between px-4 sm:px-6 shadow-sm select-none"
    >
      {/* Brand & Identity */}
      <div
        className="flex items-center gap-3 min-w-[200px] cursor-pointer focus:outline-none"
        onClick={() => setRoute('library')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setRoute('library');
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="GhostWave home, open Library screen"
      >
        <img
          src="/ghostwave-logo.svg"
          alt="GhostWave Spectral Audio Logo"
          className="h-8 w-8 object-contain transition-transform hover:scale-105"
        />
        <span className="font-headline font-bold text-lg tracking-wide text-primary">
          GhostWave
        </span>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative flex items-center">
          <span
            className="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none text-lg"
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks, artists, albums..."
            aria-label="Search local tracks"
            className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/80 pl-10 pr-9 py-2 rounded-full text-xs outline-none border border-outline-variant/20 focus:border-primary/50 focus:bg-surface-container transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-outline hover:text-on-surface text-xs"
              aria-label="Clear search input"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Controls */}
      <div className="flex items-center gap-3">
        {/* Offline Status Indicator */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-secondary text-xs border border-secondary/20"
          title="Core playback runs offline"
        >
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" aria-hidden="true" />
          <span className="font-medium">Offline</span>
        </div>

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-bright text-tertiary flex items-center justify-center transition-colors border border-outline-variant/30"
          aria-label={`Switch theme (currently ${settings.theme})`}
          title={`Switch theme (currently ${settings.theme})`}
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            {settings.theme === 'halloween-dark' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        {/* Platform Settings Shortcut */}
        <button
          onClick={() => setRoute('settings-platform')}
          className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors border border-outline-variant/20"
          aria-label="Open Settings"
          title="Settings and Platform Configuration"
        >
          <span className="material-symbols-outlined text-lg">settings</span>
        </button>
      </div>

      {/* Resize Handle: Bottom Edge */}
      <div
        onMouseDown={handleResizeStart}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize Header Height"
        aria-valuenow={layout.headerHeight}
        aria-valuemin={52}
        aria-valuemax={84}
        title="Drag to resize header height (52px - 84px)"
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-primary/50 active:bg-primary transition-colors flex items-center justify-center group focus:outline-none focus:bg-primary/40"
      >
        <div className="w-8 h-0.5 rounded-full bg-outline-variant/30 group-hover:bg-primary transition-colors" />
      </div>
    </header>
  );
};
