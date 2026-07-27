import { useEffect, useRef } from "react";

export function useTimerAudio(soundEnabled) {
  const audioContextRef = useRef(null);

  useEffect(
    () => () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    },
    [],
  );

  function prepareTimerSounds(force = false) {
    if ((!soundEnabled && !force) || audioContextRef.current) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    audioContextRef.current = new AudioContext();
    audioContextRef.current.resume().catch(() => {
      // The timer and in-app feedback remain usable if audio is blocked.
    });
  }

  function createSoundBus(audioContext) {
    const compressor = audioContext.createDynamicsCompressor();

    compressor.threshold.setValueAtTime(-14, audioContext.currentTime);
    compressor.knee.setValueAtTime(8, audioContext.currentTime);
    compressor.ratio.setValueAtTime(4, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
    compressor.release.setValueAtTime(0.3, audioContext.currentTime);
    compressor.connect(audioContext.destination);

    return compressor;
  }

  function playTone({
    audioContext,
    destination,
    duration,
    frequency,
    peakVolume,
    startTime,
    type = "sine",
  }) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  function playCompletionSound() {
    const audioContext = audioContextRef.current;

    if (!soundEnabled || !audioContext) {
      return;
    }

    try {
      const startTime = audioContext.currentTime;
      const bellBus = createSoundBus(audioContext);

      [
        { frequency: 659.25, peakVolume: 0.38, duration: 2.2 },
        { frequency: 1325.1, peakVolume: 0.18, duration: 1.75 },
        { frequency: 1964.6, peakVolume: 0.1, duration: 1.35 },
        { frequency: 2768.9, peakVolume: 0.06, duration: 0.9 },
      ].forEach((partial) => {
        playTone({
          audioContext,
          destination: bellBus,
          startTime,
          ...partial,
        });
      });
    } catch {
      // The visible completion message is the fallback when audio cannot play.
    }
  }

  function playStartSound() {
    const audioContext = audioContextRef.current;

    if (!soundEnabled || !audioContext) {
      return;
    }

    try {
      const startTime = audioContext.currentTime;
      const startBus = createSoundBus(audioContext);

      playTone({
        audioContext,
        destination: startBus,
        duration: 0.72,
        frequency: 392,
        peakVolume: 0.28,
        startTime,
        type: "triangle",
      });
      playTone({
        audioContext,
        destination: startBus,
        duration: 0.88,
        frequency: 587.33,
        peakVolume: 0.32,
        startTime: startTime + 0.2,
        type: "triangle",
      });
    } catch {
      // Starting the timer still works if audio cannot play.
    }
  }

  return {
    playCompletionSound,
    playStartSound,
    prepareTimerSounds,
  };
}
