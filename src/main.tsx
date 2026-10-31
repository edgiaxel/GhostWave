import React from 'react';
import ReactDOM from 'react-dom/client';
import { sentryTelemetry } from './services/telemetry/SentryTelemetry';
import { AppProvider } from './context/AppContext';
import { App } from './App';
import './styles/index.css';

// Initialize Sentry telemetry as early as possible
sentryTelemetry.init();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
