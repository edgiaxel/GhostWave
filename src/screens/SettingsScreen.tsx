import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppSettings } from '../types';
import { DEFAULT_OLLAMA_ENDPOINT, DEFAULT_AI_MODEL } from '../services/ai/OllamaClient';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    toggleTheme,
    addToast,
    aiConnection,
    aiInstalledModels,
    testAiConnection,
    discoverAiModels,
    sendTestAiPrompt,
  } = useApp();

  const [endpoint, setEndpoint] = useState(settings.localAi.endpoint || DEFAULT_OLLAMA_ENDPOINT);
  const [model, setModel] = useState(settings.localAi.model || DEFAULT_AI_MODEL);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [testPromptText, setTestPromptText] = useState('Verify model availability for GhostWave');
  const [isSendingPrompt, setIsSendingPrompt] = useState(false);
  const [testPromptResult, setTestPromptResult] = useState<{
    response: string;
    durationMs: number;
    model: string;
  } | null>(null);

  // Proactively check connection on screen mount if not yet checked
  useEffect(() => {
    if (aiConnection.state === 'unconfigured') {
      testAiConnection(endpoint).catch(() => {});
      discoverAiModels(endpoint).catch(() => {});
    }
  }, []);

  const handleSaveAi = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      localAi: {
        ...settings.localAi,
        endpoint: endpoint.trim() || DEFAULT_OLLAMA_ENDPOINT,
        model: model.trim() || DEFAULT_AI_MODEL,
      },
    });
    addToast({
      title: 'Settings Saved',
      message: 'Local AI configuration saved to local store.',
      type: 'success',
    });
  };

  const handleTestConnection = async () => {
    setIsTestingAi(true);
    setTestPromptResult(null);
    try {
      const status = await testAiConnection(endpoint);
      if (status.isAvailable) {
        addToast({
          title: 'Ollama Connected',
          message: `Connected to ${status.endpoint} (v${status.version || 'unknown'}) in ${status.latencyMs}ms.`,
          type: 'success',
        });
        await handleDiscoverModels();
      } else {
        addToast({
          title: status.state === 'timeout' ? 'Connection Timeout' : 'Ollama Offline',
          message: status.errorMessage || 'Unable to connect to local Ollama instance.',
          type: 'warning',
        });
      }
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleDiscoverModels = async () => {
    setIsDiscovering(true);
    try {
      const models = await discoverAiModels(endpoint);
      if (models.length > 0) {
        // Auto-select gemma3:4b if installed and current model is default
        const hasGemma3 = models.some((m) => m.name.includes('gemma3:4b'));
        if (hasGemma3 && (!model || model === 'gemma2:2b')) {
          setModel('gemma3:4b');
        }
      }
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSendTestPrompt = async () => {
    if (!testPromptText.trim()) return;
    setIsSendingPrompt(true);
    try {
      const result = await sendTestAiPrompt(testPromptText, model);
      setTestPromptResult({
        response: result.response,
        durationMs: result.durationMs,
        model: result.model,
      });
      addToast({
        title: 'Model Responded',
        message: `${result.model} replied in ${result.durationMs}ms.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Prompt execution failed.';
      addToast({
        title: 'Inference Error',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsSendingPrompt(false);
    }
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

        {/* S7.1: Local AI Configuration & Provider Setup */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-lg">smart_toy</span>
              <h2 className="font-headline font-semibold text-sm text-on-surface">Local AI Runtime (S7.1)</h2>
            </div>

            {/* Live Status Indicator */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  aiConnection.state === 'connected'
                    ? 'bg-secondary animate-pulse'
                    : aiConnection.state === 'checking'
                    ? 'bg-yellow-400 animate-spin'
                    : aiConnection.state === 'timeout'
                    ? 'bg-orange-500'
                    : 'bg-outline'
                }`}
              />
              <span className="capitalize text-on-surface-variant text-[11px]">
                {aiConnection.state === 'connected'
                  ? `Connected (${aiConnection.latencyMs}ms)`
                  : aiConnection.state}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveAi} className="flex flex-col gap-4">
            {/* Endpoint */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="ollama-endpoint" className="text-xs text-on-surface font-medium">
                  Ollama Endpoint
                </label>
                <button
                  type="button"
                  onClick={() => setEndpoint(DEFAULT_OLLAMA_ENDPOINT)}
                  className="text-[10px] text-primary hover:underline"
                >
                  Reset default (127.0.0.1)
                </button>
              </div>
              <input
                id="ollama-endpoint"
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://127.0.0.1:11434"
                className="bg-surface-container text-on-surface text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/20 outline-none focus:border-primary/50 font-mono"
              />
              <span className="text-[10px] text-outline">
                Note: Browsers treat loopback addresses (127.0.0.1 and localhost) as potentially trustworthy local origins.
              </span>
            </div>

            {/* Model Selection */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="ollama-model" className="text-xs text-on-surface font-medium">
                  Inference Model
                </label>
                <button
                  type="button"
                  onClick={handleDiscoverModels}
                  disabled={isDiscovering}
                  className="text-[10px] text-tertiary hover:underline flex items-center gap-1 disabled:opacity-40"
                >
                  <span className={`material-symbols-outlined text-[12px] ${isDiscovering ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  <span>Discover installed models</span>
                </button>
              </div>

              {aiInstalledModels.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <select
                    id="ollama-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="bg-surface-container text-on-surface text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/20 outline-none focus:border-primary/50"
                  >
                    {aiInstalledModels.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} {m.parameterSize ? `(${m.parameterSize})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  id="ollama-model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gemma3:4b"
                  className="bg-surface-container text-on-surface text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/20 outline-none focus:border-primary/50 font-mono"
                />
              )}
              <span className="text-[10px] text-outline">
                Recommended candidate: <span className="text-primary font-mono font-medium">gemma3:4b</span> (supports application-managed JSON Schema dispatch).
              </span>
            </div>

            {/* Connection Actions */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
              >
                Save Settings
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
                <span>{isTestingAi ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </form>

          {/* Test Prompt & Response Display */}
          <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/20 flex flex-col gap-3">
            <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">terminal</span>
              Inference Test Prompt
            </span>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testPromptText}
                onChange={(e) => setTestPromptText(e.target.value)}
                placeholder="Ask model to respond..."
                className="flex-1 bg-surface-container text-on-surface text-xs px-3 py-2 rounded-lg border border-outline-variant/20 outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={handleSendTestPrompt}
                disabled={isSendingPrompt || !testPromptText.trim()}
                className="px-3.5 py-2 rounded-lg bg-secondary/15 hover:bg-secondary/25 text-secondary text-xs font-semibold transition-colors disabled:opacity-40 flex items-center gap-1 shrink-0"
              >
                <span className={`material-symbols-outlined text-sm ${isSendingPrompt ? 'animate-spin' : ''}`}>
                  send
                </span>
                <span>Send</span>
              </button>
            </div>

            {testPromptResult && (
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-outline">
                  <span>Model: {testPromptResult.model}</span>
                  <span>Latency: {testPromptResult.durationMs}ms</span>
                </div>
                <p className="text-on-surface font-sans text-xs whitespace-pre-wrap leading-relaxed">
                  {testPromptResult.response}
                </p>
              </div>
            )}
          </div>

          {/* Offline & Graceful Degradation Guide */}
          <div className="p-4 rounded-xl bg-surface-container/40 border border-outline-variant/15 flex flex-col gap-2 text-xs text-on-surface-variant">
            <span className="font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-secondary">info</span>
              Model Setup & Offline Operation
            </span>
            <p className="text-[11px] leading-relaxed">
              GhostWave functions completely offline. Audio playback, visualizers, library indexing, and crates do not require AI.
            </p>
            <div className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20 font-mono text-[11px] flex flex-col gap-1 text-outline">
              <div className="text-secondary font-semibold">Terminal setup:</div>
              <div>$ ollama serve</div>
              <div>$ ollama pull gemma3:4b</div>
            </div>
          </div>
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
