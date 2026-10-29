import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppRoute } from '../../types';

interface NavItem {
  id: AppRoute;
  label: string;
  icon: string;
}

const MENU_ITEMS: NavItem[] = [
  { id: 'library', label: 'Library', icon: 'library_music' },
  { id: 'playlists', label: 'Playlists', icon: 'queue_music' },
  { id: 'health-cleanup', label: 'Health & Cleanup', icon: 'cleaning_services' },
  { id: 'audio-visualizer', label: 'Audio Visualizer', icon: 'graphic_eq' },
];

const SECONDARY_ITEMS: NavItem[] = [
  { id: 'local-ai-assistant', label: 'Local AI Assistant', icon: 'smart_toy' },
  { id: 'history', label: 'Listening History', icon: 'history' },
  { id: 'settings-platform', label: 'Settings & Platform', icon: 'settings' },
];

export const Sidebar: React.FC = () => {
  const { route, setRoute, libraryIssues } = useApp();

  const renderNavButton = (item: NavItem) => {
    const isActive = route === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setRoute(item.id)}
        aria-current={isActive ? 'page' : undefined}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
          isActive
            ? 'bg-primary/15 text-primary font-semibold shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
        }`}
      >
        <span
          className={`material-symbols-outlined text-xl ${
            isActive ? 'text-primary' : 'text-outline'
          }`}
          aria-hidden="true"
        >
          {item.icon}
        </span>

        <span className="text-xs tracking-wide flex-1 truncate">{item.label}</span>

        {item.id === 'health-cleanup' && libraryIssues.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-error/20 text-error font-semibold">
            {libraryIssues.length}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      aria-label="Deck Modules Navigation"
      className="fixed left-0 top-16 bottom-[76px] w-60 bg-surface-container-lowest/90 backdrop-blur-lg border-r border-outline-variant/20 z-40 flex flex-col justify-between p-3"
    >
      <div className="flex flex-col gap-5 overflow-y-auto">
        {/* Main Menu Section */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[11px] font-semibold text-outline tracking-wider uppercase">
            Menu
          </span>
          <nav className="flex flex-col gap-0.5" aria-label="Main Navigation">
            {MENU_ITEMS.map(renderNavButton)}
          </nav>
        </div>

        {/* Secondary Modules Section */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[11px] font-semibold text-outline tracking-wider uppercase">
            Tools
          </span>
          <nav className="flex flex-col gap-0.5" aria-label="Tools Navigation">
            {SECONDARY_ITEMS.map(renderNavButton)}
          </nav>
        </div>
      </div>

      {/* Storage Status Footer */}
      <div className="pt-2 border-t border-outline-variant/20 px-2">
        <div className="flex items-center justify-between text-xs text-outline">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>Local Vault</span>
          </span>
          <span className="font-mono text-[11px]">FLAC / MP3</span>
        </div>
      </div>
    </aside>
  );
};
