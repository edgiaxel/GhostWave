import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const LocalAiScreen: React.FC = () => {
  const { settings, tracks, addToast } = useApp();
  const [prompt, setPrompt] = useState('Make a Halloween playlist that lasts less than 45 minutes');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    schema: Record<string, unknown>;
    matchedTrackIds: string[];
    explanation: string;
  } | null>(({
    schema: {
      action: 'create_playlist',
      name: 'Halloween Midnight Tension',
      filters: {
        genre: ['Horror', 'Soundtrack'],
        minBitrateKbps: 800,
        maxDurationMinutes: 45,
      },
      confidence: 0.94,
    },
    matchedTrackIds: ['trk-1', 'trk-2', 'trk-3'],
    explanation: 'Matched 3 local tracks totaling 9 minutes 17 seconds based on genre and duration filters.',
  }));

  const samplePrompts = [
    'Halloween playlist under 45 minutes',
    'Lossless 24-bit FLAC tracks',
    'Calm John Carpenter synth ambient',
  ];

  const handleRunPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedResult({
        schema: {
          action: 'create_playlist',
          name: 'Custom Gemma Crate',
          query: prompt,
          confidence: 0.92,
        },
        matchedTrackIds: ['trk-1', 'trk-3'],
        explanation: 'Matched 2 tracks from your local collection.',
      });
      addToast({
        title: 'Playlist Proposal Generated',
        message: 'Gemma 2B structured output matched local tracks.',
        type: 'success',
      });
    }, 500);
  };

  const matchedTracks = tracks.filter((t) => generatedResult?.matchedTrackIds.includes(t.id));
  const totalDuration = matchedTracks.reduce((acc, t) => acc + t.durationSeconds, 0);

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            Local AI Assistant
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Offline structured organization via {settings.localAi.model}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-outline self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span>Ollama connected</span>
        </div>
      </div>

      {/* Query Bar */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3.5 shadow-sm">
        <form onSubmit={handleRunPrompt} className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
              smart_toy
            </span>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Local AI to create a crate or filter music..."
              className="w-full bg-surface-container text-on-surface text-xs pl-10 pr-4 py-2.5 rounded-full outline-none border border-transparent focus:border-primary/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            <span className={`material-symbols-outlined text-sm ${isGenerating ? 'animate-spin' : ''}`}>
              {isGenerating ? 'sync' : 'auto_awesome'}
            </span>
            <span>{isGenerating ? 'Searching...' : 'Ask AI'}</span>
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-outline font-medium">Try:</span>
          {samplePrompts.map((p) => (
            <button
              key={p}
              onClick={() => setPrompt(p)}
              className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Results Display */}
      {generatedResult && (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
            <div>
              <h2 className="font-headline font-bold text-base text-on-surface">
                Proposed Crate ({matchedTracks.length} tracks • {Math.floor(totalDuration / 60)}m {totalDuration % 60}s)
              </h2>
              <p className="text-xs text-outline font-mono mt-0.5">
                {generatedResult.explanation}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSchema(!showSchema)}
                className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs text-outline hover:text-on-surface transition-colors"
              >
                {showSchema ? 'Hide Schema' : 'View Schema'}
              </button>
              <button
                onClick={() => {
                  addToast({
                    title: 'Playlist Saved',
                    message: 'AI mix saved to your playlists.',
                    type: 'success',
                  });
                }}
                className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                Save Crate
              </button>
            </div>
          </div>

          {showSchema && (
            <pre className="p-3.5 rounded-xl bg-surface-container font-mono text-[11px] text-on-surface-variant overflow-x-auto border border-outline-variant/20">
              {JSON.stringify(generatedResult.schema, null, 2)}
            </pre>
          )}

          {/* Matched Tracks List */}
          <div className="flex flex-col divide-y divide-outline-variant/10">
            {matchedTracks.map((trk, idx) => (
              <div
                key={trk.id}
                className="py-3 px-2 flex items-center justify-between hover:bg-surface-container/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-outline w-4 text-center">{idx + 1}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-on-surface truncate">{trk.title}</span>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      {trk.artist} • {trk.album}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-outline">
                  {Math.floor(trk.durationSeconds / 60)}:
                  {(trk.durationSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
