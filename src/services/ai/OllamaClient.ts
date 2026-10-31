/**
 * S7.1.2: OllamaClient implementation
 * Connects to local Ollama instance via HTTP loopback with application-managed tool dispatch support.
 */

import {
  LocalAiProvider,
  ModelInfo,
  ConnectionStatus,
  GenerateOptions,
  GenerateResult,
} from './LocalAiProvider';
import { sentryTelemetry } from '../telemetry/SentryTelemetry';

export const DEFAULT_OLLAMA_ENDPOINT = 'http://127.0.0.1:11434';
export const DEFAULT_AI_MODEL = 'gemma3:4b';

interface OllamaTagModel {
  name: string;
  size?: number;
  modified_at?: string;
  details?: {
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

interface OllamaTagsResponse {
  models?: OllamaTagModel[];
}

interface OllamaVersionResponse {
  version?: string;
}

interface OllamaGenerateResponse {
  model?: string;
  response: string;
  eval_count?: number;
  eval_duration?: number;
  done?: boolean;
}

export class OllamaClient implements LocalAiProvider {
  private endpoint: string;
  private defaultModel: string;

  constructor(endpoint: string = DEFAULT_OLLAMA_ENDPOINT, defaultModel: string = DEFAULT_AI_MODEL) {
    this.endpoint = this.normalizeEndpoint(endpoint);
    this.defaultModel = defaultModel;
  }

  getEndpoint(): string {
    return this.endpoint;
  }

  setEndpoint(endpoint: string): void {
    this.endpoint = this.normalizeEndpoint(endpoint);
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  setDefaultModel(model: string): void {
    if (model.trim()) {
      this.defaultModel = model.trim();
    }
  }

  private normalizeEndpoint(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return DEFAULT_OLLAMA_ENDPOINT;
    const clean = trimmed.replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      return `http://${clean}`;
    }
    return clean;
  }

  /**
   * S7.1.3: Probe Ollama availability, version, and latency.
   * Browsers treat loopback addresses (127.0.0.1 and localhost) as potentially trustworthy local origins.
   */
  async checkConnection(timeoutMs: number = 4000): Promise<ConnectionStatus> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = performance.now();

    try {
      const res = await fetch(`${this.endpoint}/api/version`, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        return {
          isAvailable: false,
          endpoint: this.endpoint,
          state: 'error',
          errorMessage: `Ollama returned HTTP ${res.status}: ${res.statusText}`,
          latencyMs,
        };
      }

      const data: OllamaVersionResponse = await res.json();
      return {
        isAvailable: true,
        endpoint: this.endpoint,
        state: 'connected',
        version: data.version || 'unknown',
        latencyMs,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - start);

      if (err instanceof Error) {
        sentryTelemetry.captureAiProviderUnavailable({
          endpoint: this.endpoint,
          error: err.message,
        });

        if (err.name === 'AbortError') {
          return {
            isAvailable: false,
            endpoint: this.endpoint,
            state: 'timeout',
            errorMessage: `Connection timed out after ${timeoutMs}ms. Verify Ollama is running.`,
            latencyMs,
          };
        }

        return {
          isAvailable: false,
          endpoint: this.endpoint,
          state: 'offline',
          errorMessage: `Cannot connect to Ollama at ${this.endpoint}. Run 'ollama serve' in your terminal.`,
          latencyMs,
        };
      }

      return {
        isAvailable: false,
        endpoint: this.endpoint,
        state: 'error',
        errorMessage: 'An unexpected connection error occurred.',
        latencyMs,
      };
    }
  }

  /**
   * S7.1.4: Discover installed models via Ollama tags endpoint.
   */
  async listModels(timeoutMs: number = 5000): Promise<ModelInfo[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timer);

      if (!res.ok) {
        return [];
      }

      const data: OllamaTagsResponse = await res.json();
      if (!data.models || !Array.isArray(data.models)) {
        return [];
      }

      return data.models.map((m) => ({
        name: m.name,
        sizeBytes: m.size,
        modifiedAt: m.modified_at,
        family: m.details?.family,
        parameterSize: m.details?.parameter_size,
        quantizationLevel: m.details?.quantization_level,
      }));
    } catch {
      clearTimeout(timer);
      return [];
    }
  }

  /**
   * S7.1.5 & Application-managed tool dispatch:
   * Generates output from local model using structured format (json or JSON Schema).
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const model = options?.model || this.defaultModel;
    const timeoutMs = options?.timeoutMs ?? 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = performance.now();

    const requestPayload: Record<string, unknown> = {
      model,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.2,
      },
    };

    if (options?.systemPrompt) {
      requestPayload.system = options.systemPrompt;
    }

    // Support Ollama's format parameter: 'json' or JSON Schema object
    if (options?.format) {
      requestPayload.format = options.format;
    }

    try {
      const res = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      clearTimeout(timer);
      const durationMs = Math.round(performance.now() - start);

      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText);
        throw new Error(`Ollama generation failed [HTTP ${res.status}]: ${errorText}`);
      }

      const data: OllamaGenerateResponse = await res.json();
      const rawText = data.response || '';

      let parsedJson: unknown = undefined;
      if (options?.format) {
        try {
          parsedJson = JSON.parse(rawText);
        } catch {
          // If JSON parse fails, raw response remains available
        }
      }

      return {
        response: rawText,
        parsedJson,
        durationMs,
        model: data.model || model,
        evalCount: data.eval_count,
        evalDurationMs: data.eval_duration ? Math.round(data.eval_duration / 1e6) : undefined,
      };
    } catch (err: unknown) {
      clearTimeout(timer);

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error(`Generation timed out after ${timeoutMs}ms.`);
        }
        throw err;
      }

      throw new Error('Unknown error during Ollama generation.');
    }
  }
}

// Global default client instance
export const ollamaClient = new OllamaClient();
