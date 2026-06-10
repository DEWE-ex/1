const SOUND_KEY = "bookfinder_sound_enabled";

let ctx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(SOUND_KEY);
  return stored !== "false";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_KEY, enabled ? "true" : "false");
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.12,
  when = 0
) {
  const audio = getAudioContext();
  if (!audio || !isSoundEnabled()) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audio.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audio.currentTime + when + duration
  );
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime + when);
  osc.stop(audio.currentTime + when + duration);
}

function noiseBurst(duration: number, volume = 0.06) {
  const audio = getAudioContext();
  if (!audio || !isSoundEnabled()) return;

  const bufferSize = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = audio.createBufferSource();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  source.start();
}

export function primeAudio() {
  getAudioContext();
}

export function playKarutaTap() {
  tone(320, 0.06, "triangle", 0.1);
  noiseBurst(0.04, 0.04);
}

export function playKarutaCorrect() {
  tone(523, 0.12, "sine", 0.1);
  tone(659, 0.12, "sine", 0.09, 0.08);
  tone(784, 0.18, "sine", 0.08, 0.16);
}

export function playKarutaWrong() {
  tone(180, 0.2, "sawtooth", 0.07);
  tone(140, 0.25, "square", 0.05, 0.1);
}

export function playKarutaRoundStart() {
  tone(220, 0.08, "triangle", 0.12);
  tone(440, 0.15, "sine", 0.1, 0.06);
  tone(330, 0.2, "triangle", 0.08, 0.12);
}

export function playKarutaWin() {
  tone(523, 0.1, "sine", 0.1);
  tone(659, 0.1, "sine", 0.1, 0.1);
  tone(784, 0.1, "sine", 0.1, 0.2);
  tone(1047, 0.25, "sine", 0.09, 0.3);
}

export function playReadingClockDone() {
  for (let i = 0; i < 4; i++) {
    tone(880, 0.15, "sine", 0.11, i * 0.35);
    tone(660, 0.15, "triangle", 0.08, i * 0.35 + 0.18);
  }
  tone(523, 0.4, "sine", 0.1, 1.6);
}
