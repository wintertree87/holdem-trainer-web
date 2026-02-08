'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, startTime: number, type: OscillatorType = 'sine', gain = 0.12) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playNoise(duration: number, startTime: number, gain = 0.08) {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(startTime);
  source.stop(startTime + duration);
}

const MUTE_KEY = 'holdem_sound_muted';

export function useSound() {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(localStorage.getItem(MUTE_KEY) === 'true');
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem(MUTE_KEY, String(next));
      return next;
    });
  }, []);

  const playCorrect = useCallback(() => {
    if (muted) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    playTone(523, 0.12, now, 'sine', 0.1);       // C5
    playTone(659, 0.15, now + 0.08, 'sine', 0.1); // E5
  }, [muted]);

  const playWrong = useCallback(() => {
    if (muted) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    playTone(330, 0.2, now, 'sawtooth', 0.06);    // E4
    playTone(262, 0.25, now + 0.1, 'sawtooth', 0.06); // C4
  }, [muted]);

  const playCombo = useCallback(() => {
    if (muted) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    playTone(523, 0.1, now, 'sine', 0.1);         // C5
    playTone(659, 0.1, now + 0.07, 'sine', 0.1);  // E5
    playTone(784, 0.15, now + 0.14, 'sine', 0.12); // G5
  }, [muted]);

  const playLevelUp = useCallback(() => {
    if (muted) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    playTone(523, 0.15, now, 'sine', 0.1);          // C5
    playTone(659, 0.15, now + 0.12, 'sine', 0.1);   // E5
    playTone(784, 0.15, now + 0.24, 'sine', 0.12);   // G5
    playTone(1047, 0.3, now + 0.36, 'sine', 0.14);   // C6
  }, [muted]);

  const playConfetti = useCallback(() => {
    if (muted) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    playNoise(0.15, now, 0.06);
    playTone(784, 0.1, now, 'sine', 0.08);
    playTone(1047, 0.2, now + 0.05, 'sine', 0.1);
  }, [muted]);

  return { muted, toggleMute, playCorrect, playWrong, playCombo, playLevelUp, playConfetti };
}
