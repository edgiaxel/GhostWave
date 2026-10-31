#!/usr/bin/env python3
"""
Generates an original 170-second cinematic synthwave / atmospheric electronic soundtrack
for the GhostWave product film.
Zero external dependencies (uses standard library math, struct, wave, random).
"""

import math
import struct
import wave
import random

SAMPLE_RATE = 44100
TOTAL_SECONDS = 170
TOTAL_SAMPLES = int(SAMPLE_RATE * TOTAL_SECONDS)
BPM = 120.0
BEAT_SEC = 60.0 / BPM
SIXTEENTH_SEC = BEAT_SEC / 4.0

random.seed(42)

def clamp(v, min_v=-1.0, max_v=1.0):
    return max(min_v, min(max_v, v))

def generate_soundtrack(output_path):
    print(f"Generating {TOTAL_SECONDS}s original soundtrack to {output_path}...")
    
    # We will generate in chunks to keep memory reasonable
    chunk_size = 44100 * 5 # 5 seconds per chunk
    
    with wave.open(output_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2) # 16-bit
        wf.setframerate(SAMPLE_RATE)
        
        # Low-pass filter state for noise
        noise_lpf = 0.0
        
        sample_idx = 0
        while sample_idx < TOTAL_SAMPLES:
            cur_chunk = min(chunk_size, TOTAL_SAMPLES - sample_idx)
            frames = bytearray()
            
            for i in range(cur_chunk):
                t = (sample_idx + i) / SAMPLE_RATE
                
                left = 0.0
                right = 0.0
                
                # ==========================================
                # SCENE 1: THE STORM (0.0s - 18.0s)
                # ==========================================
                if t < 18.0:
                    # Thunder rumble & wind (filtered noise + low sub drone)
                    raw_noise = random.uniform(-1.0, 1.0)
                    noise_lpf += 0.02 * (raw_noise - noise_lpf)
                    rumble = noise_lpf * 1.5
                    
                    # Periodic thunder surges
                    surge = 0.0
                    for storm_time in [1.5, 4.8, 10.2, 14.5]:
                        dt = t - storm_time
                        if 0 <= dt < 3.0:
                            surge += math.exp(-dt * 1.2) * math.sin(dt * 35.0) * 0.4
                    
                    # Eerie minor drone (A2 110Hz, C3 130.8Hz)
                    drone = (math.sin(2 * math.pi * 55.0 * t) * 0.25 + 
                             math.sin(2 * math.pi * 110.0 * t) * 0.15 +
                             math.sin(2 * math.pi * 130.81 * t) * 0.1)
                    
                    env = min(1.0, t / 2.0)
                    if t > 16.0:
                        env *= (18.0 - t) / 2.0
                    
                    sig = (rumble * 0.4 + surge + drone) * env * 0.7
                    left += sig * 0.95
                    right += sig * 1.05
                
                # ==========================================
                # SCENE 2: THE PROBLEM (18.0s - 35.0s)
                # ==========================================
                if 17.5 <= t < 36.0:
                    t_sc2 = t - 18.0
                    
                    # Bass drop impact at 18.0s
                    if 0 <= t_sc2 < 3.5:
                        freq_drop = 90.0 * math.exp(-t_sc2 * 1.5) + 35.0
                        impact = math.sin(2 * math.pi * freq_drop * t_sc2) * math.exp(-t_sc2 * 1.2) * 0.8
                        left += impact
                        right += impact
                    
                    # Tension pulse (16th note clock ticking)
                    beat_phase = (t_sc2 % SIXTEENTH_SEC) / SIXTEENTH_SEC
                    tick = math.exp(-beat_phase * 20.0) * math.sin(2 * math.pi * 880.0 * t) * 0.08
                    
                    # Swelling synth riser leading up to the drop at 35.0s
                    riser = 0.0
                    if t_sc2 > 10.0:
                        riser_t = (t_sc2 - 10.0) / 7.0
                        riser_freq = 150.0 + (riser_t ** 2) * 450.0
                        riser = math.sin(2 * math.pi * riser_freq * t) * (riser_t ** 1.5) * 0.25
                    
                    sub_drone = math.sin(2 * math.pi * 55.0 * t) * 0.18
                    
                    left += (tick + sub_drone + riser) * 0.9
                    right += (tick + sub_drone + riser) * 1.1

                # ==========================================
                # SCENES 3 - 7: SYNTHWAVE GROOVE (35.0s - 155.0s)
                # ==========================================
                if 35.0 <= t < 156.0:
                    t_groove = t - 35.0
                    beat_idx = int(t_groove / BEAT_SEC)
                    beat_sub = (t_groove % BEAT_SEC) / BEAT_SEC
                    sixteenth_idx = int(t_groove / SIXTEENTH_SEC) % 16
                    sixteenth_sub = (t_groove % SIXTEENTH_SEC) / SIXTEENTH_SEC
                    
                    fade_in = min(1.0, t_groove / 2.0)
                    fade_out = 1.0
                    if t > 150.0:
                        fade_out = max(0.0, (156.0 - t) / 6.0)
                    
                    # 1. Kick drum (on beats 1, 2, 3, 4 with punchy pitch drop)
                    kick = 0.0
                    kick_decay = math.exp(-beat_sub * 12.0)
                    kick_pitch = 140.0 * math.exp(-beat_sub * 25.0) + 48.0
                    kick = math.sin(2 * math.pi * kick_pitch * (beat_sub * BEAT_SEC)) * kick_decay * 0.7
                    
                    # 2. Snare / Clap on beats 2 & 4
                    snare = 0.0
                    if beat_idx % 2 == 1:
                        snare_decay = math.exp(-beat_sub * 8.0)
                        noise = random.uniform(-1.0, 1.0)
                        tone = math.sin(2 * math.pi * 200.0 * (beat_sub * BEAT_SEC)) * 0.3
                        snare = (noise * 0.7 + tone) * snare_decay * 0.45
                    
                    # 3. Hi-hat on every 16th note (accented offbeats)
                    hat_decay = math.exp(-sixteenth_sub * 25.0)
                    hat_accent = 1.4 if sixteenth_idx % 4 == 2 else 0.7
                    hat = random.uniform(-1.0, 1.0) * hat_decay * 0.08 * hat_accent
                    
                    # 4. Bassline (Synthwave rolling 16th bass in Am: A1, C2, D2, E2)
                    root_freqs = [55.0, 55.0, 65.4, 73.4, 82.4, 73.4, 65.4, 55.0]
                    curr_root = root_freqs[(beat_idx // 4) % len(root_freqs)]
                    bass_decay = math.exp(-sixteenth_sub * 5.0)
                    bass = (math.sin(2 * math.pi * curr_root * t) * 0.6 + 
                            math.sin(2 * math.pi * curr_root * 2 * t) * 0.3) * bass_decay * 0.4
                    
                    # 5. Ambient Pad (Warm sawtooth / sine chords)
                    chord_time = (beat_idx // 8) % 4
                    if chord_time == 0:
                        chord = [220.0, 261.6, 329.6] # Am
                    elif chord_time == 1:
                        chord = [174.6, 220.0, 261.6] # F
                    elif chord_time == 2:
                        chord = [261.6, 329.6, 392.0] # C
                    else:
                        chord = [196.0, 246.9, 293.6] # G
                    
                    pad = sum(math.sin(2 * math.pi * f * t) for f in chord) * 0.08
                    
                    # 6. Gemma 3 Climax Arpeggio (78.0s - 115.0s)
                    arp = 0.0
                    if 78.0 <= t < 115.0:
                        t_arp = t - 78.0
                        arp_notes = [440.0, 523.2, 659.2, 783.9, 880.0, 659.2, 523.2, 440.0]
                        arp_idx = int(t_arp / (SIXTEENTH_SEC / 2.0)) % len(arp_notes)
                        arp_note = arp_notes[arp_idx]
                        arp_sub = (t_arp % (SIXTEENTH_SEC / 2.0)) / (SIXTEENTH_SEC / 2.0)
                        arp_env = math.exp(-arp_sub * 7.0)
                        arp = (math.sin(2 * math.pi * arp_note * t) * 0.18 + 
                               math.sin(2 * math.pi * arp_note * 2 * t) * 0.08) * arp_env
                    
                    total_groove = (kick + snare + hat + bass + pad + arp) * fade_in * fade_out
                    left += total_groove * 0.95
                    right += total_groove * 1.05

                # ==========================================
                # SCENE 8: CLOSING (155.0s - 170.0s)
                # ==========================================
                if t >= 155.0:
                    t_close = t - 155.0
                    close_fade_in = min(1.0, t_close / 1.5)
                    close_fade_out = max(0.0, (170.0 - t) / 4.0)
                    
                    # Grand resonant chord (A minor maj9)
                    chord_close = [110.0, 164.8, 220.0, 261.6, 329.6, 415.3]
                    warm_pad = sum(math.sin(2 * math.pi * f * t + math.sin(t * 0.5)) for f in chord_close) * 0.09
                    sub_drone = math.sin(2 * math.pi * 55.0 * t) * 0.2
                    
                    out_sig = (warm_pad + sub_drone) * close_fade_in * close_fade_out * 0.8
                    left += out_sig * 0.95
                    right += out_sig * 1.05

                # Master Limiter / Soft Clipping
                left_sample = int(clamp(left) * 32767 * 0.82)
                right_sample = int(clamp(right) * 32767 * 0.82)
                
                frames += struct.pack('<hh', left_sample, right_sample)
            
            wf.writeframes(frames)
            sample_idx += cur_chunk
            
    print(f"Soundtrack generated successfully: {output_path}")

if __name__ == '__main__':
    generate_soundtrack('video/public/soundtrack.wav')
