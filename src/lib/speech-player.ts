import { createContext, useContext, useSyncExternalStore } from "react";

// Reads the critique aloud with the browser's built-in Web Speech API: free,
// no key, no server. Voice quality depends on the device (macOS/iOS and
// Chrome's "Google" voices are good).
//
// The text is split into sentences and spoken one at a time, because Chrome
// cuts long utterances off after ~15s. Every sentence keeps the key of the
// on-screen text it came from, so the page can highlight the sentence and the
// word being spoken (<Speakable>), and a player can pause, skip ±30s, change
// speed and seek. Times are estimates: the API reports no durations.
// See design-system/patterns/listen.md.

export interface SpeechSegment {
  /** The key of the <Speakable> (or block) that shows this text. */
  key: string;
  /** Spoken, and highlighted sentence by sentence and word by word on screen. */
  text: string;
  /** Spoken before the text but not shown, e.g. "Issue 2, critical." */
  lead?: string;
  /** The player's caption while this is read. */
  label: string;
}

export type PlayerStatus = "off" | "playing" | "paused" | "ended";

export interface PlayerState {
  status: PlayerStatus;
  /** The sentence being read (or that resumes on play). */
  index: number;
  rate: number;
  /** The word being spoken: [start, end) within the current sentence's text. */
  word: [number, number] | null;
  /** performance.now() when the current sentence started; null while silent. */
  startedAt: number | null;
}

interface Sentence {
  key: string;
  /** Position of this sentence within its segment. */
  n: number;
  text: string;
  lead?: string;
  label: string;
  /** Estimated length at 1×, in seconds. */
  secs: number;
}

export const RATES = [0.75, 1, 1.25, 1.5, 2];
const RATE_KEY = "datsoff.listen.rate";
/** Speech at 1× runs about 165 words a minute, plus a short breath between sentences. */
const WORDS_PER_SEC = 2.75;
const PAUSE_SECS = 0.35;

/** Shared by the player and <Speakable>, so spoken and shown sentences line up. */
export const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

const wordCount = (t: string) => t.split(/\s+/).filter(Boolean).length;

const PREFERRED = [
  /premium|enhanced|natural/i,
  /google us english|google uk english female/i,
  /samantha|ava|allison|serena|daniel|karen|moira|aria|jenny/i,
];

export function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  for (const re of PREFERRED) {
    const v = voices.find((x) => re.test(x.name));
    if (v) return v;
  }
  return voices.find((v) => v.default) ?? voices[0];
}

function savedRate() {
  try {
    const r = Number(localStorage.getItem(RATE_KEY));
    return RATES.includes(r) ? r : 1;
  } catch {
    return 1;
  }
}

export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

export class SpeechPlayer {
  private sentences: Sentence[] = [];
  /** Where each sentence starts, at 1×, in seconds. */
  private starts: number[] = [];
  private totalSecs = 0;
  private state: PlayerState = {
    status: "off",
    index: 0,
    rate: 1,
    word: null,
    startedAt: null,
  };
  private listeners = new Set<() => void>();
  /** Bumped whenever speech is cut, so callbacks from the old utterance go quiet. */
  private run = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  /** Held on purpose: Chrome drops the events of utterances that get garbage-collected. */
  private utterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.state = { ...this.state, rate: savedRate() };
    // Voices load asynchronously in Chrome; touching the list starts that.
    if (speechSupported()) window.speechSynthesis.getVoices();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getState = () => this.state;

  private set(patch: Partial<PlayerState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  /** The sentence at an index (the current one by default). */
  sentence(i = this.state.index): Sentence | undefined {
    return this.sentences[i];
  }

  get count() {
    return this.sentences.length;
  }

  /** Total length at the current speed, in seconds. */
  get total() {
    return this.totalSecs / this.state.rate;
  }

  /** How far in we are at the current speed, in seconds (estimated). */
  elapsed(now = performance.now()) {
    const { status, index, rate, startedAt } = this.state;
    if (status === "ended") return this.total;
    const base = (this.starts[index] ?? 0) / rate;
    if (startedAt === null) return base;
    const s = this.sentences[index];
    return base + Math.min((now - startedAt) / 1000, (s?.secs ?? 0) / rate);
  }

  /** Starts reading these segments from the top. */
  start(segments: SpeechSegment[]) {
    this.sentences = segments.flatMap((seg) =>
      splitSentences(seg.text).map((text, n) => {
        const lead = n === 0 ? seg.lead : undefined;
        return {
          key: seg.key,
          n,
          text,
          lead,
          label: seg.label,
          secs: wordCount(`${lead ?? ""} ${text}`) / WORDS_PER_SEC + PAUSE_SECS,
        };
      }),
    );
    let t = 0;
    this.starts = this.sentences.map((s) => {
      const at = t;
      t += s.secs;
      return at;
    });
    this.totalSecs = t;
    this.playFrom(0);
  }

  toggle() {
    const { status, index } = this.state;
    if (status === "playing") this.pause();
    else this.playFrom(status === "ended" ? 0 : index);
  }

  pause() {
    if (this.state.status !== "playing") return;
    // Cancel rather than speechSynthesis.pause(), which is unreliable across
    // browsers; resuming restarts the current sentence.
    this.halt();
    this.set({ status: "paused", startedAt: null, word: null });
  }

  /** Jumps to a time (seconds at the current speed), keeping play/pause as it was. */
  seek(secs: number) {
    if (!this.sentences.length) return;
    const at = Math.max(0, Math.min(secs, this.total)) * this.state.rate;
    let i = 0;
    while (i + 1 < this.starts.length && this.starts[i + 1] <= at) i++;
    this.jump(i);
  }

  skip(deltaSecs: number) {
    this.seek(this.elapsed() + deltaSecs);
  }

  /** Jumps to a sentence of an on-screen block (click-to-read). */
  seekTo(key: string, n: number) {
    const i = this.sentences.findIndex((s) => s.key === key && s.n === n);
    if (i >= 0) this.jump(i, true);
  }

  setRate(rate: number) {
    try {
      localStorage.setItem(RATE_KEY, String(rate));
    } catch {
      /* the speed just isn't remembered */
    }
    const playing = this.state.status === "playing";
    this.set({ rate });
    // The new speed applies from the start of the current sentence.
    if (playing) this.playFrom(this.state.index);
  }

  stop() {
    this.halt();
    this.set({ status: "off", index: 0, word: null, startedAt: null });
  }

  private jump(i: number, play = false) {
    if (play || this.state.status === "playing") this.playFrom(i);
    else {
      this.halt();
      this.set({ status: "paused", index: i, word: null, startedAt: null });
    }
  }

  private playFrom(i: number) {
    this.halt();
    if (i >= this.sentences.length) {
      this.set({ status: "ended", word: null, startedAt: null });
      return;
    }
    const mine = this.run;
    this.set({ status: "playing", index: i, word: null, startedAt: null });
    // Chrome sometimes ignores a speak() issued right after cancel().
    this.timer = setTimeout(() => this.speak(i, mine), 60);
  }

  private speak(i: number, mine: number) {
    if (mine !== this.run) return;
    const s = this.sentences[i];
    const spoken = s.lead ? `${s.lead} ${s.text}` : s.text;
    const offset = spoken.length - s.text.length;
    const u = new SpeechSynthesisUtterance(spoken);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = this.state.rate;
    u.onstart = () => {
      if (mine === this.run) this.set({ startedAt: performance.now() });
    };
    u.onboundary = (e) => {
      if (mine !== this.run || e.name !== "word") return;
      const start = e.charIndex - offset;
      if (start < 0) return;
      const len = e.charLength || (/^\S+/.exec(s.text.slice(start))?.[0].length ?? 0);
      this.set({ word: [start, start + len] });
    };
    u.onend = () => {
      if (mine === this.run) this.playFrom(i + 1);
    };
    u.onerror = (e) => {
      if (mine !== this.run || e.error === "interrupted" || e.error === "canceled") return;
      this.playFrom(i + 1);
    };
    this.utterance = u;
    window.speechSynthesis.speak(u);
  }

  private halt() {
    this.run++;
    clearTimeout(this.timer);
    this.utterance = null;
    if (speechSupported()) window.speechSynthesis.cancel();
  }
}

export const SpeechPlayerContext = createContext<SpeechPlayer | null>(null);

const noop = () => () => {};

/** Reads a slice of the player's state. Return a primitive so components only re-render when it changes. */
export function usePlayer<T>(select: (p: SpeechPlayer, s: PlayerState) => T, fallback: T): T {
  const player = useContext(SpeechPlayerContext);
  return useSyncExternalStore(
    player?.subscribe ?? noop,
    () => (player ? select(player, player.getState()) : fallback),
    () => fallback,
  );
}

/** Whether the sentence being read belongs to this key (for blocks that aren't <Speakable>). */
export function useReadingBlock(key: string) {
  return usePlayer((p, s) => s.status !== "off" && p.sentence()?.key === key, false);
}
