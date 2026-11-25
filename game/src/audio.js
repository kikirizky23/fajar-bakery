// Tiny synthesized sound board for Fajar Bakery. Every sound is built with
// the Web Audio API at run time: no audio files, no network, no samples.
let ctx = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, filterFreq) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

export const sfx = {
  click() { tone(660, 0.07, 'triangle', 0.12); },
  pickup() { tone(520, 0.09, 'sine', 0.14, 0, 780); },
  place() { tone(440, 0.08, 'triangle', 0.14, 0, 330); },
  error() { tone(180, 0.22, 'sawtooth', 0.10, 0, 120); },
  ovenIn() { noiseBurst(0.35, 0.10, 900); tone(220, 0.3, 'sine', 0.10, 0, 330); },
  ding() { tone(880, 0.35, 'sine', 0.16); tone(1318, 0.4, 'sine', 0.10, 0.08); },
  serve() {
    tone(523, 0.12, 'triangle', 0.16);
    tone(659, 0.12, 'triangle', 0.16, 0.09);
    tone(784, 0.22, 'triangle', 0.18, 0.18);
  },
  coin() { tone(988, 0.1, 'square', 0.06); tone(1319, 0.18, 'square', 0.06, 0.07); },
  angry() { tone(320, 0.3, 'sawtooth', 0.10, 0, 180); },
  shiftWin() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.16, i * 0.13));
  },
  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'triangle', 0.14, i * 0.16));
  },
  toggleMute() { muted = !muted; return muted; },
  get muted() { return muted; },
  unlock() { ensureCtx(); },
};
