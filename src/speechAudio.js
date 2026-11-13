// Sofi's voice, ported from Ask Sofi's speechAudio.ts and reworked for fluid playback.
// The original clip is 21 s of babbled phrases separated by long silences. Playing it as a
// loop and hard-stopping at every pause cut syllables in half and often landed in silence
// while letters were still appearing. Instead, the decoded clip is mapped once:
//   - voiced phrases (silences of 90 ms or more are skipped),
//   - syllable dips (quiet points inside a phrase).
// Speaking starts on a syllable onset, chains phrase to phrase without the gaps, and on a
// pause finishes the current syllable before a short fade. One source at a time, never two.
// Status: off | loading | ready | playing | blocked | unavailable.

const RESUME_GRACE_MS = 300; // time for the browser to resume the context before calling it blocked
const STEP = 0.01; // analysis window (s)
const VOICED = 0.08; // fraction of the clip's peak loudness that counts as voice
const GAP = 0.09; // silences at least this long are skipped (between phrases and long word breaks)
const DIP = 0.22; // fraction of the peak that marks a syllable boundary
const SETTLE = 0.12; // longest a syllable may run on after the text pauses (s)
const FADE_IN = 0.012;
const FADE_OUT = 0.035;

function defaultCreateContext() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) throw new Error('Web Audio unavailable');
  return new Context();
}

async function defaultFetchData(src) {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Audio unavailable (${response.status})`);
  return response.arrayBuffer();
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Loudness per 10 ms window, the voiced phrases and their syllable dips.
function analyse(buffer) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
  const win = Math.round(buffer.sampleRate * STEP);
  const env = [];
  for (let i = 0; i < buffer.length; i += win) {
    let sum = 0;
    const end = Math.min(i + win, buffer.length);
    for (const data of channels) for (let j = i; j < end; j++) sum += data[j] * data[j];
    env.push(Math.sqrt(sum / ((end - i) * channels.length)));
  }
  const peak = Math.max(...env) || 1;
  const loud = env.map((v) => v / peak);
  const phrases = [];
  let start = -1;
  let quiet = 0;
  loud.forEach((v, i) => {
    if (v >= VOICED) {
      if (start < 0) start = i;
      quiet = 0;
    } else if (start >= 0 && ++quiet * STEP >= GAP) {
      phrases.push([start, i - quiet + 1]);
      start = -1;
      quiet = 0;
    }
  });
  if (start >= 0) phrases.push([start, loud.length - quiet]);
  return {
    loud,
    phrases: phrases.filter(([a, z]) => (z - a) * STEP >= 0.2).map(([a, z]) => ({ start: a * STEP, end: z * STEP })),
  };
}

export function createSpeechAudio({ src, createContext = defaultCreateContext, fetchData = defaultFetchData, volume = 0.6 }) {
  let status = 'off';
  let context = null;
  let buffer = null;
  let map = null;
  let loading = null;
  let voice = null; // { node, gain, phrase, offset, at }: the one source that is speaking
  let tail = null; // the previous source while it fades out
  let phrase = 0; // where the next utterance resumes
  let cursor = 0;

  function loadBuffer(ctx) {
    if (buffer) return Promise.resolve(buffer);
    if (!loading) {
      loading = fetchData(src)
        .then((data) => ctx.decodeAudioData(data))
        .then((decoded) => {
          map = analyse(decoded);
          buffer = decoded;
          if (!map.phrases.length) map.phrases = [{ start: 0, end: decoded.duration }];
          cursor = map.phrases[0].start;
          return decoded;
        });
      loading.catch(() => {
        loading = null; // on failure, the next attempt downloads again
      });
    }
    return loading;
  }

  // Must be called inside a user gesture: it creates or resumes the context right there.
  async function prepare() {
    if (context?.state === 'running' && buffer && (status === 'ready' || status === 'playing')) return true;
    if (!context) {
      try {
        context = createContext();
      } catch {
        status = 'unavailable';
        return false;
      }
    }
    const ctx = context;
    if (status !== 'playing') status = 'loading';
    const resumed = ctx.state === 'running' ? Promise.resolve() : ctx.resume().catch(() => undefined);
    try {
      await loadBuffer(ctx);
    } catch {
      status = 'unavailable';
      return false;
    }
    await Promise.race([resumed, wait(RESUME_GRACE_MS)]);
    if (context !== ctx) return false; // disposed meanwhile
    if (ctx.state !== 'running') {
      status = 'blocked';
      return false;
    }
    if (status !== 'playing') status = 'ready';
    return true;
  }

  function silence(source, at = context.currentTime) {
    if (!source) return;
    source.node.onended = null;
    source.gain.gain.cancelScheduledValues(at);
    source.gain.gain.setValueAtTime(source.gain.gain.value, at);
    source.gain.gain.linearRampToValueAtTime(0, at + 0.008);
    try {
      source.node.stop(at + 0.01);
    } catch {
      // already stopped
    }
  }

  // Plays phrase `index` from `offset` until the phrase ends, then carries on with the next one.
  function play(index, offset) {
    const { phrases } = map;
    if (offset >= phrases[index].end - 0.06) {
      index = (index + 1) % phrases.length; // nothing left of this phrase: move on
      offset = -1;
    }
    const { start, end } = phrases[index];
    const from = offset >= start ? offset : start;
    const now = context.currentTime;
    const node = context.createBufferSource();
    const gain = context.createGain();
    node.buffer = buffer;
    node.connect(gain);
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + FADE_IN);
    node.start(now, from, end - from);
    voice = { node, gain, phrase: index, offset: from, at: now };
    node.onended = () => {
      if (voice?.node !== node) return;
      gain.disconnect();
      play((index + 1) % phrases.length, -1); // the gap between phrases is never heard
    };
  }

  function startVoice() {
    if (!context || !buffer || voice) return;
    if (status !== 'ready' && status !== 'playing') return;
    if (context.state !== 'running') {
      status = 'blocked';
      return;
    }
    if (tail) {
      silence(tail.source); // never two voices at once
      tail = null;
    }
    play(phrase, cursor);
    status = 'playing';
  }

  // Lets the current syllable finish (up to SETTLE), then fades out; the next start resumes there.
  // Returns how many ms the voice is still audible, so the mouth can close with it.
  function stopVoice() {
    if (!voice || !context) return 0;
    const now = context.currentTime;
    const current = voice;
    voice = null;
    const { loud, phrases } = map;
    const { end } = phrases[current.phrase];
    const position = current.offset + (now - current.at);
    let stopAt = Math.min(position + SETTLE, end);
    for (let i = Math.ceil(position / STEP); i * STEP < stopAt; i++) {
      if (loud[i] < DIP && i * STEP > position + 0.02) {
        stopAt = i * STEP;
        break;
      }
    }
    const when = now + (stopAt - position);
    current.node.onended = null;
    current.gain.gain.setValueAtTime(volume, when);
    current.gain.gain.linearRampToValueAtTime(0, when + FADE_OUT);
    try {
      current.node.stop(when + FADE_OUT + 0.01);
    } catch {
      // already stopped
    }
    tail = { source: current };
    current.node.addEventListener('ended', () => {
      current.gain.disconnect();
      if (tail?.source === current) tail = null;
    });
    phrase = current.phrase;
    cursor = stopAt + FADE_OUT;
    if (status === 'playing') status = 'ready';
    return Math.round((when - now + FADE_OUT) * 1000);
  }

  function dispose() {
    if (context) {
      silence(voice);
      silence(tail?.source);
    }
    voice = null;
    tail = null;
    const ctx = context;
    context = null;
    if (ctx) ctx.close().catch(() => undefined);
    status = 'off';
  }

  return { prepare, startVoice, stopVoice, dispose, getStatus: () => status };
}
