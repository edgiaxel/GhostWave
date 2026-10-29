import React from 'react';
import { useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { LibraryScreen } from './screens/LibraryScreen';
import { PlaylistsScreen } from './screens/PlaylistsScreen';
import { HealthCleanupScreen } from './screens/HealthCleanupScreen';
import { VisualizerScreen } from './screens/VisualizerScreen';
import { LocalAiScreen } from './screens/LocalAiScreen';
import { ListeningHistoryScreen } from './screens/ListeningHistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';

export const AppContent: React.FC = () => {
  const { route } = useApp();

  let ScreenComponent: React.FC;
  switch (route) {
    case 'library':
      ScreenComponent = LibraryScreen;
      break;
    case 'playlists':
      ScreenComponent = PlaylistsScreen;
      break;
    case 'health-cleanup':
      ScreenComponent = HealthCleanupScreen;
      break;
    case 'audio-visualizer':
      ScreenComponent = VisualizerScreen;
      break;
    case 'local-ai-assistant':
      ScreenComponent = LocalAiScreen;
      break;
    case 'history':
      ScreenComponent = ListeningHistoryScreen;
      break;
    case 'settings-platform':
      ScreenComponent = SettingsScreen;
      break;
    default:
      ScreenComponent = NotFoundScreen;
      break;
  }

  return (
    <AppShell>
      <ScreenComponent />
    </AppShell>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};
