/**
 * useSound.js
 * Generates simple sound effects using the Web Audio API.
 * No external audio files needed — pure synthesis.
 */

import { useCallback, useRef } from 'react';

export function useSound() {
  const ctxRef = useRef(null);

  // Lazy-create AudioContext on first use (browser requires user gesture)
  function getCtx() {
    if (!ctxRef.current) {
      try {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  }

  /** Play a tone sequence */
  function playTones(notes, volume = 0.3) {
    const ctx = getCtx();
    if (!ctx) return;

    let time = ctx.currentTime;
    notes.forEach(({ freq, dur, type = 'sine' }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.start(time);
      osc.stop(time + dur);
      time += dur * 0.9;
    });
  }

  const playCorrect = useCallback(() => {
    playTones([
      { freq: 523, dur: 0.1 },
      { freq: 659, dur: 0.1 },
      { freq: 784, dur: 0.2 },
    ], 0.25);
  }, []);

  const playWrong = useCallback(() => {
    playTones([{ freq: 150, dur: 0.3, type: 'sawtooth' }], 0.2);
  }, []);

  const playTick = useCallback(() => {
    playTones([{ freq: 880, dur: 0.05 }], 0.1);
  }, []);

  const playStart = useCallback(() => {
    playTones([
      { freq: 392, dur: 0.1 },
      { freq: 523, dur: 0.1 },
      { freq: 659, dur: 0.15 },
      { freq: 784, dur: 0.25 },
    ], 0.25);
  }, []);

  const playLobby = useCallback(() => {
    playTones([{ freq: 440, dur: 0.1 }, { freq: 550, dur: 0.15 }], 0.15);
  }, []);

  return { playCorrect, playWrong, playTick, playStart, playLobby };
}
