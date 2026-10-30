export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export interface PlaybackEngineEvents {
  onStatusChange?: (status: PlaybackStatus) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (errorMessage: string) => void;
}

export class PlaybackEngine {
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;

  private currentStatus: PlaybackStatus = 'idle';
  private currentUrl: string | null = null;
  private volume = 0.85;
  private isMuted = false;

  private events: PlaybackEngineEvents = {};

  constructor(events?: PlaybackEngineEvents) {
    if (events) {
      this.events = events;
    }
    this.initAudioElement();
  }

  private initAudioElement(): void {
    if (typeof Audio === 'undefined') return;

    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.volume = this.volume;
    this.audio.muted = this.isMuted;

    this.audio.addEventListener('play', () => {
      this.setStatus('playing');
    });

    this.audio.addEventListener('pause', () => {
      if (this.currentStatus !== 'ended') {
        this.setStatus('paused');
      }
    });

    this.audio.addEventListener('waiting', () => {
      this.setStatus('loading');
    });

    this.audio.addEventListener('canplay', () => {
      if (this.currentStatus === 'loading' && !this.audio?.paused) {
        this.setStatus('playing');
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio) return;
      const cur = this.audio.currentTime || 0;
      const dur = this.audio.duration || 0;
      this.events.onTimeUpdate?.(cur, isNaN(dur) || !isFinite(dur) ? 0 : dur);
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (!this.audio) return;
      const dur = this.audio.duration || 0;
      this.events.onTimeUpdate?.(this.audio.currentTime || 0, isNaN(dur) || !isFinite(dur) ? 0 : dur);
    });

    this.audio.addEventListener('ended', () => {
      this.setStatus('ended');
      this.events.onEnded?.();
    });

    this.audio.addEventListener('error', () => {
      const errorMsg = this.audio?.error
        ? `Audio decode error (${this.audio.error.code}): ${this.audio.error.message}`
        : 'Failed to load or decode audio source.';
      this.setStatus('error');
      this.events.onError?.(errorMsg);
    });
  }

  private setStatus(status: PlaybackStatus): void {
    this.currentStatus = status;
    this.events.onStatusChange?.(status);
  }

  getStatus(): PlaybackStatus {
    return this.currentStatus;
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  getDuration(): number {
    const dur = this.audio?.duration;
    return dur && !isNaN(dur) && isFinite(dur) ? dur : 0;
  }

  /**
   * Connect Web Audio Analyser node for live visualizer streaming.
   */
  getAnalyser(): AnalyserNode | null {
    if (this.analyser) return this.analyser;
    if (!this.audio || typeof window === 'undefined') return null;

    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;

      if (!this.audioContext) {
        this.audioContext = new AudioContextClass();
      }

      if (!this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      return this.analyser;
    } catch {
      return null;
    }
  }

  async loadAndPlay(url: string, startTime = 0): Promise<void> {
    if (!this.audio) {
      this.initAudioElement();
    }
    if (!this.audio) return;

    this.setStatus('loading');
    this.currentUrl = url;
    if (this.audio.src !== url) {
      this.audio.src = url;
    }

    if (startTime > 0) {
      try {
        this.audio.currentTime = startTime;
      } catch {
        const onLoaded = () => {
          if (this.audio) {
            this.audio.currentTime = startTime;
            this.audio.removeEventListener('loadedmetadata', onLoaded);
          }
        };
        this.audio.addEventListener('loadedmetadata', onLoaded);
      }
    }

    // Resume AudioContext if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        // Continue even if context resume fails
      }
    }

    try {
      await this.audio.play();
      this.setStatus('playing');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      this.setStatus('error');
      const msg = err instanceof Error ? err.message : 'Audio playback error';
      this.events.onError?.(msg);
    }
  }

  async play(): Promise<void> {
    if (!this.audio) {
      this.initAudioElement();
    }
    if (!this.audio) return;
    if (!this.audio.src && this.currentUrl) {
      this.audio.src = this.currentUrl;
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        // Pass through
      }
    }

    try {
      await this.audio.play();
      this.setStatus('playing');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      this.setStatus('error');
      const msg = err instanceof Error ? err.message : 'Playback failed';
      this.events.onError?.(msg);
    }
  }

  pause(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.setStatus('paused');
  }

  seek(seconds: number): void {
    if (!this.audio) return;
    const dur = this.getDuration();
    const target = Math.max(0, dur > 0 ? Math.min(seconds, dur) : seconds);
    try {
      this.audio.currentTime = target;
    } catch {
      // Pass through
    }
    this.events.onTimeUpdate?.(target, dur);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.muted = muted;
    }
  }

  setEvents(events: PlaybackEngineEvents): void {
    this.events = { ...this.events, ...events };
  }

  destroy(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audio = null;
    this.analyser = null;
    this.sourceNode = null;
    this.audioContext = null;
  }
}

export const playbackEngine = new PlaybackEngine();
