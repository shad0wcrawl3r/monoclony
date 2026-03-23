// Web Audio API sound effects
// All sounds are synthesized procedurally — no external files needed.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  // Resume if suspended (browsers require user gesture first)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function playTone(
  freq: number,
  type: OscillatorType,
  duration: number,
  gainVal = 0.3,
  delay = 0,
): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    gain.gain.setValueAtTime(gainVal, c.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration);
  } catch {
    // Audio not supported or blocked — fail silently
  }
}

function playNoise(duration: number, gainVal = 0.1): void {
  try {
    const c = getCtx();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    const gain = c.createGain();
    source.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(gainVal, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.start();
    source.stop(c.currentTime + duration);
  } catch {
    // Fail silently
  }
}

export const SFX = {
  roll(): void {
    // Rattling dice: rapid noise bursts
    for (let i = 0; i < 6; i++) {
      playNoise(0.05, 0.08 + Math.random() * 0.04);
      playTone(200 + Math.random() * 300, 'square', 0.04, 0.05, i * 0.06);
    }
  },

  move(): void {
    // Short tick
    playTone(440, 'square', 0.06, 0.15);
  },

  buy(): void {
    // Upward chime
    playTone(523, 'sine', 0.1, 0.2);
    playTone(659, 'sine', 0.1, 0.2, 0.1);
    playTone(784, 'sine', 0.15, 0.2, 0.2);
  },

  rent(): void {
    // Descending tones — paying
    playTone(440, 'sawtooth', 0.08, 0.15);
    playTone(330, 'sawtooth', 0.08, 0.15, 0.1);
    playTone(220, 'sawtooth', 0.12, 0.15, 0.2);
  },

  jail(): void {
    // Low buzzer
    playTone(150, 'sawtooth', 0.3, 0.3);
    playTone(100, 'sawtooth', 0.3, 0.3, 0.15);
  },

  card(): void {
    // Quick blip
    playTone(880, 'square', 0.05, 0.1);
    playTone(1100, 'square', 0.05, 0.1, 0.06);
  },

  go(): void {
    // Collect $200 fanfare
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => playTone(f, 'sine', 0.12, 0.25, i * 0.08));
  },

  trade(): void {
    // Two-tone handshake
    playTone(660, 'triangle', 0.1, 0.2);
    playTone(880, 'triangle', 0.1, 0.2, 0.12);
  },

  mortgage(): void {
    // Dull thud
    playTone(200, 'sawtooth', 0.15, 0.2);
    playNoise(0.08, 0.06);
  },

  unmort(): void {
    // Brighter than mortgage
    playTone(400, 'triangle', 0.1, 0.2);
    playTone(500, 'triangle', 0.1, 0.2, 0.1);
  },

  win(): void {
    // Victory fanfare
    const melody = [523, 523, 523, 415, 523, 0, 659, 0, 523];
    melody.forEach((f, i) => {
      if (f > 0) playTone(f, 'sine', 0.15, 0.3, i * 0.15);
    });
  },

  bankrupt(): void {
    // Sad descending tones
    const notes = [330, 262, 196, 131];
    notes.forEach((f, i) => playTone(f, 'sawtooth', 0.2, 0.25, i * 0.18));
  },

  click(): void {
    // UI click
    playTone(800, 'square', 0.04, 0.08);
  },

  house(): void {
    // Build sound — ascending
    playTone(392, 'triangle', 0.08, 0.15);
    playTone(494, 'triangle', 0.08, 0.15, 0.09);
    playTone(587, 'triangle', 0.1, 0.2, 0.18);
  },
};
