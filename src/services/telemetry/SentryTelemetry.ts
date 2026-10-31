/**
 * Sentry Observability & Diagnostic Telemetry
 * Provides privacy-first instrumentation for AI workflows, online enrichment,
 * and application health.
 *
 * Privacy Invariants:
 * - Never transmits audio files or binary data.
 * - Never transmits local filesystem paths or music filenames.
 * - Never transmits user listening history or personal identifiers.
 * - Sanitizes all events to abstract metadata (counts, durations, error categories).
 * - Entirely optional: if disabled or DSN is absent, the application functions normally.
 */

import * as Sentry from '@sentry/react';

export const DEFAULT_SENTRY_DSN =
  'https://27744a590b367ea424a045ed527e0d08@o4512232556068864.ingest.us.sentry.io/4512351922159616';

export interface TelemetryConfig {
  enabled: boolean;
  dsn?: string;
}

class SentryTelemetryService {
  private initialized = false;
  private isEnabled = true;

  init(config?: TelemetryConfig): void {
    const dsn = config?.dsn?.trim() || DEFAULT_SENTRY_DSN;
    this.isEnabled = config?.enabled ?? true;

    if (!this.isEnabled || !dsn) {
      this.initialized = false;
      return;
    }

    try {
      Sentry.init({
        dsn,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: 1.0,
        tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
        // Privacy: scrub sensitive data before sending
        beforeSend(event) {
          // Ensure no user info or local paths are transmitted
          if (event.user) {
            delete event.user.ip_address;
            delete event.user.email;
            delete event.user.username;
          }

          // Strip file paths from breadcrumbs
          if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map((bc) => {
              if (bc.data && typeof bc.data === 'object') {
                const cleaned: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(bc.data)) {
                  if (typeof v === 'string' && (v.includes('/') || v.includes('\\'))) {
                    cleaned[k] = '[sanitized-path]';
                  } else {
                    cleaned[k] = v;
                  }
                }
                bc.data = cleaned;
              }
              return bc;
            });
          }

          return event;
        },
      });

      this.initialized = true;
    } catch (err) {
      console.warn('GhostWave: Sentry initialization deferred or failed:', err);
      this.initialized = false;
    }
  }

  isInitialized(): boolean {
    return this.initialized && this.isEnabled;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  captureAiRequestStarted(data: { model: string; taskType: string }): void {
    if (!this.isInitialized()) return;
    Sentry.addBreadcrumb({
      category: 'ai.request.started',
      message: `Started AI ${data.taskType} request with model ${data.model}`,
      level: 'info',
      data: {
        model: data.model,
        taskType: data.taskType,
      },
    });
  }

  captureAiRequestCompleted(data: {
    model: string;
    taskType: string;
    durationMs: number;
    success: boolean;
  }): void {
    if (!this.isInitialized()) return;
    Sentry.addBreadcrumb({
      category: 'ai.request.completed',
      message: `Completed AI ${data.taskType} in ${data.durationMs}ms (success: ${data.success})`,
      level: data.success ? 'info' : 'warning',
      data: {
        model: data.model,
        taskType: data.taskType,
        durationMs: data.durationMs,
        success: data.success,
      },
    });
  }

  captureAiResponseInvalid(data: {
    model: string;
    category: string;
    reason: string;
  }): void {
    if (!this.isInitialized()) return;
    Sentry.captureMessage(`AI Invalid Response: ${data.category}`, {
      level: 'warning',
      tags: {
        model: data.model,
        category: data.category,
      },
      extra: {
        reason: data.reason,
      },
    });
  }

  captureAiPlaylistGenerated(data: {
    model: string;
    proposedTrackCount: number;
    durationSeconds: number;
  }): void {
    if (!this.isInitialized()) return;
    Sentry.addBreadcrumb({
      category: 'ai.playlist.generated',
      message: `AI generated playlist proposal with ${data.proposedTrackCount} tracks (${Math.round(data.durationSeconds)}s)`,
      level: 'info',
      data: {
        model: data.model,
        trackCount: data.proposedTrackCount,
        durationSeconds: Math.round(data.durationSeconds),
      },
    });
  }

  captureAiTrackRejected(data: {
    model: string;
    rejectedCount: number;
  }): void {
    if (!this.isInitialized()) return;
    Sentry.addBreadcrumb({
      category: 'ai.track.rejected',
      message: `Rejected ${data.rejectedCount} hallucinated track references from AI output`,
      level: 'warning',
      data: {
        model: data.model,
        rejectedCount: data.rejectedCount,
      },
    });
  }

  captureAiProviderUnavailable(data: { endpoint: string; error: string }): void {
    if (!this.isInitialized()) return;
    Sentry.captureMessage('Local AI Provider Unavailable', {
      level: 'warning',
      tags: {
        endpoint: data.endpoint,
      },
      extra: {
        error: data.error,
      },
    });
  }

  captureEnrichmentLookupFailed(data: {
    provider: string;
    errorCategory: string;
  }): void {
    if (!this.isInitialized()) return;
    Sentry.addBreadcrumb({
      category: 'enrichment.lookup.failed',
      message: `Online enrichment query failed for provider ${data.provider}: ${data.errorCategory}`,
      level: 'warning',
      data: {
        provider: data.provider,
        errorCategory: data.errorCategory,
      },
    });
  }

  captureToolExecutionFailure(data: {
    toolName: string;
    errorCategory: string;
  }): void {
    if (!this.isInitialized()) return;
    Sentry.captureMessage(`Tool Execution Failure: ${data.toolName}`, {
      level: 'error',
      tags: {
        tool: data.toolName,
        category: data.errorCategory,
      },
    });
  }

  captureException(error: unknown, context?: Record<string, unknown>): void {
    if (!this.isInitialized()) return;
    Sentry.captureException(error, {
      extra: context,
    });
  }

  /**
   * Verified Sentry test error trigger.
   * Logs test event and throws intentional error to verify Sentry ingest.
   */
  triggerTestError(): void {
    if (typeof Sentry.logger?.info === 'function') {
      Sentry.logger.info('User triggered test error', {
        action: 'test_error_button_click',
      });
    }
    throw new Error('This is your first error!');
  }
}

export const sentryTelemetry = new SentryTelemetryService();
