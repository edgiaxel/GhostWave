/**
 * S7.1: Local AI Provider Interface
 * Defines the contract for offline local inference and application-managed tool dispatch.
 */

export interface ModelInfo {
  name: string;
  sizeBytes?: number;
  modifiedAt?: string;
  family?: string;
  parameterSize?: string;
  quantizationLevel?: string;
}

export type ConnectionState = 'connected' | 'offline' | 'timeout' | 'error' | 'unconfigured' | 'checking';

export interface ConnectionStatus {
  isAvailable: boolean;
  endpoint: string;
  state: ConnectionState;
  latencyMs?: number;
  version?: string;
  errorMessage?: string;
}

export interface GenerateOptions {
  model?: string;
  /**
   * Application-managed tool dispatch format contract:
   * Can be 'json' or a structured JSON Schema object passed to Ollama's format parameter.
   */
  format?: 'json' | Record<string, unknown>;
  systemPrompt?: string;
  timeoutMs?: number;
  temperature?: number;
}

export interface GenerateResult {
  response: string;
  parsedJson?: unknown;
  durationMs: number;
  model: string;
  evalCount?: number;
  evalDurationMs?: number;
}

export interface LocalAiProvider {
  /**
   * Test availability, latency, and version of the local inference engine.
   */
  checkConnection(timeoutMs?: number): Promise<ConnectionStatus>;

  /**
   * Discover installed local models (e.g. gemma3:4b).
   */
  listModels(timeoutMs?: number): Promise<ModelInfo[]>;

  /**
   * Send a prompt to the local model with optional JSON Schema structure.
   */
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;

  /**
   * Get current base endpoint URL.
   */
  getEndpoint(): string;

  /**
   * Update base endpoint URL.
   */
  setEndpoint(endpoint: string): void;
}
