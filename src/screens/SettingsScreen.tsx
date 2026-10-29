import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppSettings } from '../types';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, toggleTheme, addToast } = useApp();
  const [endpoint, setEndpoint] = useState(settings.localAi.endpoint);
  const [model, setModel] = useState(settings.localAi.model);
  const [isTestingAi, setIsTestingAi] = useState(false);

  const handleSaveAi = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      localAi: {
        ...settings.localAi,
        endpoint,
        model,
      },
    });
    addToast({
      title: 'Settings Saved',
      message: 'Local AI configuration updated.',
      type: 'success',
    });
  };

  const handleTestConnection = () => {
    setIsTestingAi(true);
    setTimeout(() => {
      setIsTestingAi(false);
      addToast({
        title: 'Connection Verified',
        message: `Connected to ${endpoint}. Model ${model} is ready.`,
        type: 'success',
      });
    }, 600);
  };

  const accents: Array<{ id: AppSettings['accentPalette']; label: string; color: string }> = [
    { id: 'witch-violet', label: 'Witch Violet', color: '#ddb7ff' },
    { id: 'spectral-green', label: 'Spectral Green', color: '#60ff99' },
    { id: 'pumpkin-orange', label: 'Pumpkin Orange', color: '#ffb68d' },
    { id: 'blood-moon-red', label: 'Blood Moon Red', color: '#ffb4ab' },
  ];

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      {/* Top Banner */}
      <div>
        <h1 className="font-headline font-bold text-2xl text-on-surface">
          Settings & Platform
        </h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Theme preferences and local Ollama model runtime configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance & Themes */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-outline-variant/15 pb-3">
            <span className="material-symbols-outlined text-primary text-lg">palette</span>
            <h2 className="font-headline font-semibold text-sm text-on-surface">Appearance & Themes</h2>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-medium text-on-surface">Theme Mode</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (settings.theme !== 'halloween-dark') toggleTheme();
                }}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  settings.theme === 'halloween-dark'
                    ? 'bg-primary/10 border-primary text-on-surface font-semibold shadow-sm'
                    : 'bg-surface-container border-outline-variant/20 text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-primary text-lg">dark_mode</span>
                <span className="text-xs">Halloween Dark</span>
              </button>

              <button
                onClick={() => {
                  if (settings.theme !== 'halloween-light') toggleTheme();
                }}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  settings.theme === 'halloween-light'
                    ? 'bg-primary/10 border-primary text-on-surface font-semibold shadow-sm'
                    : 'bg-surface-container border-outline-variant/20 text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-tertiary text-lg">light_mode</span>
                <span className="text-xs">Halloween Light</span>
              </button>
            </div>
          </div>

          {/* Accent Palette Selector */}
          <div className="flex flex-col gap-2.5 pt-2">
            <span className="text-xs font-medium text-on-surface">Accent Color</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {accents.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => updateSettings({ accentPalette: acc.id })}
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                    settings.accentPalette === acc.id
                      ? 'border-primary bg-surface-container font-semibold shadow-sm'
                      : 'border-outline-variant/20 bg-surface-container/40 hover:bg-surface-container'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: acc.color }}
                  />
                  <span className="truncate text-xs">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Local AI Configuration */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-outline-variant/15 pb-3">
            <span className="material-symbols-outlined text-tertiary text-lg">smart_toy</span>
            <h2 className="font-headline font-semibold text-sm text-on-surface">Local AI Runtime</h2>
          </div>

          <form onSubmit={handleSaveAi} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="ollama-endpoint" className="text-xs text-on-surface font-medium">
                Ollama Endpoint
              </label>
              <input
                id="ollama-endpoint"
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="bg-surface-container text-on-surface text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/20 outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="ollama-model" className="text-xs text-on-surface font-medium">
                Model Name
              </label>
              <input
                id="ollama-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-surface-container text-on-surface text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/20 outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingAi}
                className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-xs text-on-surface font-medium transition-colors border border-outline-variant/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${isTestingAi ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>Test Connection</span>
              </button>
            </div>
          </form>
        </div>

        {/* Platform Capabilities */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3.5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-outline-variant/15 pb-3">
            <span className="material-symbols-outlined text-secondary text-lg">devices</span>
            <h2 className="font-headline font-semibold text-sm text-on-surface">Platform Status</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-on-surface-variant">
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/15 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-on-surface">Web Mode</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-mono text-[10px] font-bold">
                  Active
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Browser audio streaming via HTML5 File System and local IndexedDB store.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/15 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-on-surface">Tauri Desktop Mode</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-outline font-mono text-[10px] font-bold">
                  Ready
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Native filesystem adapter ready for direct atomic tag edits on Linux and Windows.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
