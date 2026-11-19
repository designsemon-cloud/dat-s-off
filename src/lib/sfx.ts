// Small UI sound effects, synthesised with the Web Audio API: no files to
// load, nothing to license. Used by the landing's "Why Dats Off." scenes, and
// only after the viewer turns sound on (browsers block audio before a
// gesture anyway). Everything is short and quiet: these are cues, not music.

export type Sfx = "tick" | "click" | "whoosh" | "alert" | "chime" | "pop" | "rise" | "key";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** Create (or resume) the audio context. Call from a click handler. */
export function unlockSfx() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function tone(
  freq: number,
  dur: number,
  {
    type = "sine",
    gain = 0.5,
    at = 0,
    to,
  }: { type?: OscillatorType; gain?: number; at?: number; to?: number } = {},
) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(
  dur: number,
  {
    gain = 0.4,
    from = 600,
    to = 4000,
    q = 0.8,
  }: { gain?: number; from?: number; to?: number; q?: number } = {},
) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

export function playSfx(name: Sfx) {
  if (!ctx || ctx.state !== "running") return;
  switch (name) {
    case "tick":
      return tone(1850, 0.05, { gain: 0.18 });
    case "key":
      return tone(2400 + Math.random() * 500, 0.025, { type: "triangle", gain: 0.06 });
    case "click":
      tone(900, 0.04, { type: "triangle", gain: 0.35 });
      return noise(0.03, { gain: 0.12, from: 3000, to: 5000, q: 2 });
    case "pop":
      return tone(420, 0.12, { gain: 0.35, to: 880 });
    case "whoosh":
      return noise(0.45, { gain: 0.22, from: 400, to: 3800, q: 0.7 });
    case "alert":
      tone(660, 0.12, { type: "triangle", gain: 0.3 });
      return tone(440, 0.22, { type: "triangle", gain: 0.3, at: 0.11 });
    case "chime":
      tone(1046.5, 0.5, { gain: 0.22 });
      return tone(1568, 0.6, { gain: 0.14, at: 0.06 });
    case "rise":
      return tone(320, 0.9, { gain: 0.12, to: 960 });
  }
}
