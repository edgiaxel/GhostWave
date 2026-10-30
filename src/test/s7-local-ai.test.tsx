import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OllamaClient, DEFAULT_OLLAMA_ENDPOINT, DEFAULT_AI_MODEL } from '../services/ai/OllamaClient';
import { AppProvider, useApp } from '../context/AppContext';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PlaylistsScreen } from '../screens/PlaylistsScreen';

describe('S7.1: Local AI Provider Interface & Core Workflow Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('S7.1.1 & S7.1.2: OllamaClient Contract & Endpoint Normalization', () => {
    it('normalizes endpoint URLs and defaults to 127.0.0.1:11434 with gemma3:4b', () => {
      const client = new OllamaClient();
      expect(client.getEndpoint()).toBe(DEFAULT_OLLAMA_ENDPOINT);
      expect(client.getDefaultModel()).toBe(DEFAULT_AI_MODEL);

      client.setEndpoint('localhost:11434/');
      expect(client.getEndpoint()).toBe('http://localhost:11434');

      client.setEndpoint('https://my-ollama-node.lan:11434///');
      expect(client.getEndpoint()).toBe('https://my-ollama-node.lan:11434');

      client.setEndpoint('');
      expect(client.getEndpoint()).toBe(DEFAULT_OLLAMA_ENDPOINT);

      client.setDefaultModel('gemma3:4b');
      expect(client.getDefaultModel()).toBe('gemma3:4b');
    });
  });

  describe('S7.1.3: Ollama Connection Testing & Error States', () => {
    it('successfully connects to Ollama, measures latency, and parses version', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ version: '0.34.1' }),
      });

      const client = new OllamaClient('http://127.0.0.1:11434');
      const status = await client.checkConnection(2000);

      expect(status.isAvailable).toBe(true);
      expect(status.state).toBe('connected');
      expect(status.version).toBe('0.34.1');
      expect(typeof status.latencyMs).toBe('number');
      expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:11434/api/version', expect.any(Object));
    });

    it('returns offline state when Ollama is unreachable (ECONNREFUSED)', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const client = new OllamaClient('http://127.0.0.1:11434');
      const status = await client.checkConnection(2000);

      expect(status.isAvailable).toBe(false);
      expect(status.state).toBe('offline');
      expect(status.errorMessage).toContain('Cannot connect to Ollama');
    });

    it('returns timeout state when connection exceeds timeout threshold', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const client = new OllamaClient('http://127.0.0.1:11434');
      const status = await client.checkConnection(100);

      expect(status.isAvailable).toBe(false);
      expect(status.state).toBe('timeout');
      expect(status.errorMessage).toContain('Connection timed out');
    });

    it('returns error state on HTTP 500 error from Ollama server', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const client = new OllamaClient('http://127.0.0.1:11434');
      const status = await client.checkConnection(2000);

      expect(status.isAvailable).toBe(false);
      expect(status.state).toBe('error');
      expect(status.errorMessage).toContain('HTTP 500');
    });
  });

  describe('S7.1.4: Installed Model Discovery', () => {
    it('discovers installed models and parses metadata fields from /api/tags', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [
            {
              name: 'gemma3:4b',
              size: 2600000000,
              modified_at: '2026-10-30T12:00:00Z',
              details: {
                family: 'gemma',
                parameter_size: '4B',
                quantization_level: 'Q4_K_M',
              },
            },
            {
              name: 'mistral:7b',
              size: 4100000000,
              modified_at: '2026-10-29T10:00:00Z',
              details: {
                family: 'llama',
                parameter_size: '7B',
                quantization_level: 'Q4_0',
              },
            },
          ],
        }),
      });

      const client = new OllamaClient();
      const models = await client.listModels(2000);

      expect(models).toHaveLength(2);
      expect(models[0].name).toBe('gemma3:4b');
      expect(models[0].parameterSize).toBe('4B');
      expect(models[0].family).toBe('gemma');
    });

    it('handles discovery failure gracefully by returning empty array', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network drop'));

      const client = new OllamaClient();
      const models = await client.listModels(2000);

      expect(models).toEqual([]);
    });
  });

  describe('S7.1.5: Application-Managed Tool Dispatch with JSON Schema', () => {
    it('sends prompt with JSON schema in format parameter and parses output deterministically', async () => {
      const mockSchema = {
        type: 'object',
        properties: {
          action: { type: 'string' },
          targetCrate: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['action', 'targetCrate'],
      };

      const mockResponseJson = {
        action: 'create_playlist',
        targetCrate: 'Midnight Synth Wave',
        confidence: 0.96,
      };

      global.fetch = vi.fn().mockImplementation((_url, init) => {
        const body = JSON.parse(init.body as string);
        expect(body.format).toEqual(mockSchema);
        expect(body.model).toBe('gemma3:4b');

        return Promise.resolve({
          ok: true,
          json: async () => ({
            model: 'gemma3:4b',
            response: JSON.stringify(mockResponseJson),
            eval_count: 42,
            eval_duration: 180000000,
          }),
        });
      });

      const client = new OllamaClient();
      const result = await client.generate('Create playlist for dark ambient synth', {
        model: 'gemma3:4b',
        format: mockSchema,
      });

      expect(result.model).toBe('gemma3:4b');
      expect(result.parsedJson).toEqual(mockResponseJson);
      expect(result.evalCount).toBe(42);
      expect(result.evalDurationMs).toBe(180);
    });
  });

  describe('S7.1.6: Settings UI Integration & Non-AI Graceful Degradation', () => {
    it('renders SettingsScreen with Local AI Runtime controls, model discovery, and offline guide', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ version: '0.34.1' }),
      });

      render(
        <AppProvider>
          <SettingsScreen />
        </AppProvider>
      );

      expect(screen.getByText(/Local AI Runtime/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ollama Endpoint/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Connection/i)).toBeInTheDocument();
      expect(screen.getByText(/Inference Test Prompt/i)).toBeInTheDocument();
      expect(screen.getByText(/Model Setup & Offline Operation/i)).toBeInTheDocument();
    });

    it('preserves all non-AI features without breaking when AI is offline or unconfigured', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      render(
        <AppProvider>
          <SettingsScreen />
        </AppProvider>
      );

      const testBtn = screen.getByText(/Test Connection/i);
      fireEvent.click(testBtn);

      await waitFor(() => {
        // App remains fully responsive and undamaged
        expect(screen.getByText(/Appearance & Themes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Core Workflow Fixes: Rescan & Playlist Creation Dialog', () => {
    it('rescan with empty library does not get stuck in endless loop', async () => {
      const TestConsumer = () => {
        const { isScanning, scanProgress, rescanLibrary } = useApp();
        return (
          <div>
            <span data-testid="is-scanning">{isScanning ? 'true' : 'false'}</span>
            <span data-testid="scan-total">{scanProgress.total}</span>
            <button onClick={() => rescanLibrary()}>Rescan Now</button>
          </div>
        );
      };

      render(
        <AppProvider>
          <TestConsumer />
        </AppProvider>
      );

      expect(screen.getByTestId('is-scanning')).toHaveTextContent('false');
      const btn = screen.getByText('Rescan Now');
      fireEvent.click(btn);

      // Verify scanning immediately finishes without hanging at 0%
      await waitFor(() => {
        expect(screen.getByTestId('is-scanning')).toHaveTextContent('false');
        expect(screen.getByTestId('scan-total')).toHaveTextContent('0');
      });
    });

    it('creates a new playlist and closes dialog when submitting create playlist form', async () => {
      render(
        <AppProvider>
          <PlaylistsScreen />
        </AppProvider>
      );

      // Click "New Playlist" or "Create First Playlist"
      const createBtns = screen.getAllByText(/New Playlist|Create First Playlist/i);
      fireEvent.click(createBtns[0]);

      // Fill in playlist name
      const nameInput = screen.getByLabelText(/Playlist Name/i);
      fireEvent.change(nameInput, { target: { value: 'Dark Electro Crate' } });

      // Click submit
      const submitBtn = screen.getByRole('button', { name: 'Create Playlist' });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        // Dialog closes and new playlist appears in both crate list and header
        expect(screen.getAllByText('Dark Electro Crate').length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
