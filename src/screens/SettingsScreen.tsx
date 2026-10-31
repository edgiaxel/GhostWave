import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppSettings } from '../types';
import { DEFAULT_OLLAMA_ENDPOINT, DEFAULT_AI_MODEL } from '../services/ai/OllamaClient';
import { DEFAULT_SENTRY_DSN } from '../services/telemetry/SentryTelemetry';

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
    triggerSentryTestError,
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

  // S8 Online Enrichment State
  const [enrichmentEnabled, setEnrichmentEnabled] = useState(settings.onlineEnrichment?.enabled ?? true);
  const [enrichmentProvider, setEnrichmentProvider] = useState<'musicbrainz' | 'serpapi'>(
    settings.onlineEnrichment?.provider === 'serpapi' ? 'serpapi' : 'musicbrainz'
  );
  const [serpApiKey, setSerpApiKey] = useState(settings.onlineEnrichment?.serpApiKey || '');
  const [lookupCoverArt, setLookupCoverArt] = useState(
    settings.onlineEnrichment?.lookupCoverArt ?? settings.onlineEnrichment?.lookupAlbumArt ?? true
  );
  const [lookupLyrics, setLookupLyrics] = useState(settings.onlineEnrichment?.lookupLyrics ?? true);

  // S9 Audio Conversion State
  const [defaultFormat, setDefaultFormat] = useState<'wav' | 'ogg'>(
    settings.audioConversion?.defaultFormat || 'wav'
  );
  const [sampleRate, setSampleRate] = useState<44100 | 48000>(
    (settings.audioConversion?.sampleRate as 44100 | 48000) || 44100
  );
  const [channels, setChannels] = useState<1 | 2>(
    (settings.audioConversion?.channels as 1 | 2) || 2
  );

  // Sentry Observability State
  const [sentryEnabled, setSentryEnabled] = useState(settings.sentry?.enabled ?? true);
  const [sentryDsn, setSentryDsn] = useState(settings.sentry?.dsn || DEFAULT_SENTRY_DSN);

  const handleSaveSentry = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      sentry: {
        enabled: sentryEnabled,
        dsn: sentryDsn.trim() || DEFAULT_SENTRY_DSN,
      },
    });
    addToast({
      title: 'Observability Settings Saved',
      message: sentryEnabled ? 'Sentry diagnostic telemetry active.' : 'Sentry telemetry disabled.',
      type: 'success',
    });
  };

  const handleTriggerTestError = () => {
    try {
      triggerSentryTestError();
    } catch (err: unknown) {
      addToast({
        title: 'Sentry Test Event Logged',
        message: err instanceof Error ? err.message : 'Captured verified error',
        type: 'info',
      });
    }
  };

  const handleSaveEnrichment = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      onlineEnrichment: {
        enabled: enrichmentEnabled,
        provider: enrichmentProvider,
        serpApiKey: serpApiKey.trim() || undefined,
        lookupAlbumArt: lookupCoverArt,
        lookupCoverArt,
        lookupLyrics,
      },
    });
    addToast({
      title: 'Enrichment Settings Saved',
      message: 'Online provider preferences and credentials updated.',
      type: 'success',
    });
  };

  const handleSaveConversion = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      audioConversion: {
        defaultFormat,
        sampleRate,
        channels,
      },
    });
    addToast({
      title: 'Conversion Settings Saved',
      message: 'Audio encoder configuration updated.',
      type: 'success',
    });
  };

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

        {/* S8: Online Enrichment & External Metadata */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">travel_explore</span>
              <h2 className="font-headline font-semibold text-sm text-on-surface">Online Enrichment (S8)</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enrichmentEnabled}
                onChange={(e) => setEnrichmentEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
            </label>
          </div>

          <form onSubmit={handleSaveEnrichment} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="enrichment-provider" className="text-xs font-medium text-on-surface">
                Primary Metadata Provider
              </label>
              <select
                id="enrichment-provider"
                value={enrichmentProvider}
                onChange={(e) => setEnrichmentProvider(e.target.value as 'musicbrainz' | 'serpapi')}
                disabled={!enrichmentEnabled}
                className="bg-surface-container text-on-surface text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/20 outline-none focus:border-secondary/50 disabled:opacity-50"
              >
                <option value="musicbrainz">MusicBrainz (Open Database, Rate-Limited)</option>
                <option value="serpapi">SerpApi (Google Knowledge Graph, Key Required)</option>
              </select>
              <span className="text-[10px] text-outline">
                MusicBrainz provides community metadata and release MBIDs for artwork lookup.
              </span>
            </div>

            {enrichmentProvider === 'serpapi' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="serpapi-key" className="text-xs font-medium text-on-surface">
                  SerpApi Private API Key
                </label>
                <input
                  id="serpapi-key"
                  type="password"
                  value={serpApiKey}
                  onChange={(e) => setSerpApiKey(e.target.value)}
                  placeholder="Enter secret SerpApi token..."
                  disabled={!enrichmentEnabled}
                  className="bg-surface-container text-on-surface text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/20 outline-none focus:border-secondary/50 font-mono disabled:opacity-50"
                />
                <span className="text-[10px] text-outline">
                  Stored securely in your local browser storage. Never hardcoded or logged.
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
                <input
                  type="checkbox"
                  checked={lookupCoverArt}
                  onChange={(e) => setLookupCoverArt(e.target.checked)}
                  disabled={!enrichmentEnabled}
                  className="rounded text-secondary focus:ring-secondary/40"
                />
                <span>Fetch Cover Art from Cover Art Archive (CC0)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
                <input
                  type="checkbox"
                  checked={lookupLyrics}
                  onChange={(e) => setLookupLyrics(e.target.checked)}
                  disabled={!enrichmentEnabled}
                  className="rounded text-secondary focus:ring-secondary/40"
                />
                <span>Fetch Lyrics from LRCLIB (Plain and Synced LRC)</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={!enrichmentEnabled}
                className="px-4 py-2 rounded-full bg-secondary text-on-secondary text-xs font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-40"
              >
                Save Enrichment Settings
              </button>
            </div>
          </form>

          {/* Rate Limits & Privacy Notice */}
          <div className="p-3.5 rounded-xl bg-surface-container/40 border border-outline-variant/15 flex flex-col gap-1.5 text-xs text-on-surface-variant">
            <span className="font-semibold text-on-surface flex items-center gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
              Rate Limits &amp; Privacy Safeguards
            </span>
            <p className="text-[10px] text-outline leading-relaxed">
              MusicBrainz requires 1 second between queries. GhostWave queues all online queries to respect this limit. Lookups only trigger on explicit user request; core features function completely offline.
            </p>
          </div>
        </div>

        {/* S9: Audio Conversion Engine */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-lg">transform</span>
              <h2 className="font-headline font-semibold text-sm text-on-surface">Audio Conversion Engine (S9)</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary font-mono text-[10px] font-bold">
              Lossless PCM
            </span>
          </div>

          <form onSubmit={handleSaveConversion} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="default-format" className="text-xs font-medium text-on-surface">
                  Default Target Format
                </label>
                <select
                  id="default-format"
                  value={defaultFormat}
                  onChange={(e) => setDefaultFormat(e.target.value as 'wav' | 'ogg')}
                  className="bg-surface-container text-on-surface text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/20 outline-none focus:border-tertiary/50"
                >
                  <option value="wav">WAV (16-bit PCM Lossless)</option>
                  <option value="ogg">OGG / WebM</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="sample-rate" className="text-xs font-medium text-on-surface">
                  Default Sample Rate
                </label>
                <select
                  id="sample-rate"
                  value={sampleRate}
                  onChange={(e) => setSampleRate(Number(e.target.value) as 44100 | 48000)}
                  className="bg-surface-container text-on-surface text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/20 outline-none focus:border-tertiary/50"
                >
                  <option value="44100">44,100 Hz (Audio CD Standard)</option>
                  <option value="48000">48,000 Hz (Studio / Broadcast)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="channels" className="text-xs font-medium text-on-surface">
                Channels
              </label>
              <select
                id="channels"
                value={channels}
                onChange={(e) => setChannels(Number(e.target.value) as 1 | 2)}
                className="bg-surface-container text-on-surface text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/20 outline-none focus:border-tertiary/50"
              >
                <option value="2">Stereo (2 Channels)</option>
                <option value="1">Mono (1 Channel)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-tertiary text-on-tertiary text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
              >
                Save Conversion Settings
              </button>
            </div>
          </form>

          {/* Engine & Licensing Safeguards */}
          <div className="p-3.5 rounded-xl bg-surface-container/40 border border-outline-variant/15 flex flex-col gap-1.5 text-xs text-on-surface-variant">
            <span className="font-semibold text-on-surface flex items-center gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-sm text-tertiary">lock_reset</span>
              Non-Destructive &amp; In-Browser Re-encoding
            </span>
            <p className="text-[10px] text-outline leading-relaxed">
              GhostWave converts audio via genuine Web Audio API PCM sample re-quantization. Source files are strictly preserved and never overwritten without explicit prompt. No FFmpeg binary bundling required.
            </p>
          </div>
        </div>

        {/* Sentry Observability & Application Monitoring */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">monitoring</span>
              <h2 className="font-headline font-semibold text-sm text-on-surface">AI &amp; App Observability (Sentry)</h2>
            </div>
            <label htmlFor="sentry-toggle" className="relative inline-flex items-center cursor-pointer">
              <input
                id="sentry-toggle"
                aria-label="Toggle Sentry Observability"
                type="checkbox"
                checked={sentryEnabled}
                onChange={(e) => setSentryEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <form onSubmit={handleSaveSentry} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sentry-dsn" className="text-xs font-medium text-on-surface">
                Sentry Project DSN
              </label>
              <input
                id="sentry-dsn"
                type="password"
                value={sentryDsn}
                onChange={(e) => setSentryDsn(e.target.value)}
                placeholder="https://...@ingest.sentry.io/..."
                disabled={!sentryEnabled}
                className="bg-surface-container text-on-surface text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/20 outline-none focus:border-primary/50 font-mono disabled:opacity-50"
              />
              <span className="text-[10px] text-outline">
                Connected to project <span className="font-mono text-primary font-medium">ghostwave</span> (org: <span className="font-mono text-primary font-medium">axel-shuu</span>).
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                disabled={!sentryEnabled}
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-40"
              >
                Save Sentry Settings
              </button>

              <button
                type="button"
                onClick={handleTriggerTestError}
                disabled={!sentryEnabled}
                className="px-4 py-2 rounded-full bg-error/15 hover:bg-error/25 text-error text-xs font-semibold transition-all border border-error/30 flex items-center gap-1.5 disabled:opacity-40"
                title="Throws a test error to verify Sentry event ingest"
              >
                <span className="material-symbols-outlined text-sm">bug_report</span>
                <span>Break the world</span>
              </button>
            </div>
          </form>

          {/* Telemetry Disclosure & Privacy Safeguards */}
          <div className="p-3.5 rounded-xl bg-surface-container/40 border border-outline-variant/15 flex flex-col gap-1.5 text-xs text-on-surface-variant">
            <span className="font-semibold text-on-surface flex items-center gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-sm text-primary">security</span>
              Sanitized Telemetry Disclosure
            </span>
            <ul className="text-[10px] text-outline leading-relaxed list-disc list-inside flex flex-col gap-0.5">
              <li><strong className="text-on-surface">Captured:</strong> AI request duration, schema parsing failures, model offline/timeout errors, tool status codes, unhandled runtime crashes.</li>
              <li><strong className="text-secondary">Strictly Excluded:</strong> Audio file bytes, music file paths, filenames, personal listening history, and raw user prompts.</li>
            </ul>
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
