/**
 * AERO Audio Alert Utility
 * Uses Web Audio API to synthesize emergency alarms and notification chimes
 * without requiring external sound files.
 */

class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Play a gentle positive chime (e.g. junction cleared, emergency accepted)
   */
  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25); // G5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Audio playback fails silently if browser policy blocks it before user gesture
    }
  }

  /**
   * Play urgent alert chime (e.g. approaching ambulance alert for police or hospital)
   */
  public playEmergencyAlert() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Two-tone urgent beep (Hi-Lo)
      for (let i = 0; i < 2; i++) {
        const startTime = now + (i * 0.22);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, startTime); // A5
        osc.frequency.setValueAtTime(587.33, startTime + 0.1); // D5

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
      }
    } catch {
      // Audio playback fails silently if browser policy blocks it
    }
  }

  /**
   * Play continuous ambulance siren pulse (for SOS activation)
   */
  public playSirenPulse() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      // Siren sweep
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.4);
      osc.frequency.linearRampToValueAtTime(650, now + 0.8);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch {
      // Audio playback fails silently
    }
  }
}

export const audioAlert = new AudioAlertService();
