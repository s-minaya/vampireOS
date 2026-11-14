import { createSpeechAudio } from '../speechAudio.js';
import { createDialogue, bubble } from '../dialogue.js';
import { music, TRACK } from '../music.js';
import riffUrl from '../assets/luis-riff.mp3';
import voiceUrl from '../assets/luis-voice.mp3';
import neutralUrl from '../assets/luis-neutral.webp';
import crazyUrl from '../assets/luis-crazy.webp';
import mouthUrl from '../assets/luis-mouth.webp';
import noteUrl from '../assets/luis-note.webp';
import wavesUrl from '../assets/luis-waves.webp';
import bolt1 from '../assets/luis-bolt-1.webp';
import bolt2 from '../assets/luis-bolt-2.webp';
import bolt3 from '../assets/luis-bolt-3.webp';
import bolt4 from '../assets/luis-bolt-4.webp';
import confused1 from '../assets/luis-confused-1.webp';
import confused2 from '../assets/luis-confused-2.webp';

// from_luis.mp3: Luis's entrance. A terse system log, the lights go out, then he bursts in
// (luis-crazy) on the guitar riff, with lightning, neon notes and sound waves timed to the
// music. When the riff ends he settles into his neutral face and delivers his note through
// the shared speech bubble with his sans voice. Then his song's card: PLAY TRACK hands the
// song to the persistent player (music.js), which outlives this scene.

// Approved note (provisional English; see VAMPIREOS.md). One bubble per paragraph.
const LINES = [
  'I have absolutely no idea how any of this works.',
  'So I did the one thing I actually know how to do.',
  'I made you a song.',
  'Hope you like it, mate.',
];

// The system log before the lights go out.
const SETUP = ['> Mounting from_luis.mp3...', '> Format: unknown. Contents: guitar.', '> Volume limiter: not found.', '> Kindly stand back.'];
const SETUP_STEP = 420; // ms between log lines
const BLACKOUT_HOLD = 520; // on the last line, before the lights go out
const HUM = 900; // dark and humming before the first chord (longer if the riff is still loading)
const LOAD_CAP = 9000; // never wait longer than this for the riff and sprites

// luis-riff.mp3 is epic-guitar-riff.mp3 from 2.010 s to 7.880 s, normalised to -1.5 dBFS: a
// low pickup thump, the riff's bright entry at 2.287 s, a gallop, its hardest hit at 4.69 s,
// a descending power-chord run to the final chord at 6.99 s, and the breath before the next
// phrase. SCORE times are seconds after the entry (its measured transients; there is no
// steady grid to assume). The entry is located in the decoded audio at runtime (attackIn).
const RIFF_SECONDS = 5.6; // entry to end of file
const ATTACK_FALLBACK = 0.28; // entry position in the decoded file, measured in Chromium
const THUMP = -0.257; // the pickup thump, still in the dark
const SCORE = [
  [0.65, 'chug'], [0.65, 'note'], [1.13, 'chug'], [1.36, 'note'], [1.43, 'chug'], [1.63, 'chug'], [1.63, 'note'],
  [1.79, 'chug'], [1.95, 'chug'], [2.33, 'note'],
  [2.4, 'strike', 1], [2.77, 'chug'], [2.77, 'note'], [2.93, 'chug'], [3.0, 'note'], [3.69, 'chug'], [3.85, 'note'],
  [4.12, 'chug'], [4.18, 'note'], [4.4, 'chug'],
  [4.7, 'strike', 2], [4.93, 'chug'], [5.04, 'note'], [5.2, 'echo'], [5.32, 'echo'],
];
const STRIKES = [['1l', '1r'], ['2', '3', '4'], ['1l', '1r', '3', '4']]; // the bolts each big hit throws
const RIFF_GAIN = 0.7;
const VOICE_VOLUME = 0.42; // sans-voice.mp3 is about 4 dB hotter than Sofi's clip
const SETTLE_MS = 900; // from the riff's last fade to his first word
const DONE_DELAY = 500; // after his voice fades, before the track card appears

const BOLTS = { '1l': bolt1, '1r': bolt1, 2: bolt2, 3: bolt3, 4: bolt4 };

const scene = `
  <div class="win lz-win" data-ref="win">
    <div class="win-bar"><div class="win-chip">from_luis.mp3</div></div>
    <div class="lz-body" data-ref="body">
      <div class="lz-stage" data-ref="stage" data-phase="setup">
        <div class="log lz-log" data-ref="log" aria-live="polite"></div>
        <div class="lz-glow" data-ref="glow" aria-hidden="true"></div>
        <div class="lz-line" aria-hidden="true"></div>
        <div class="lz-waves" aria-hidden="true"><div class="lz-waves-pulse" data-ref="pulse"><img src="${wavesUrl}" alt="" draggable="false"></div></div>
        <div class="lz-luis" data-ref="luis" role="img" aria-label="Luis">
          <div class="lz-bob" data-ref="bob"><div class="lz-tremble">
            <img class="lz-frame" src="${neutralUrl}" alt="" draggable="false">
            <img class="lz-mouth" src="${mouthUrl}" alt="" draggable="false">
            <img class="lz-frame lz-frame--crazy" src="${crazyUrl}" alt="" draggable="false">
          </div></div>
        </div>
        <div class="lz-bolts" aria-hidden="true">${Object.entries(BOLTS)
          .map(([id, src]) => `<img class="lz-bolt lz-bolt--${id}" data-bolt="${id}" src="${src}" alt="" draggable="false">`)
          .join('')}</div>
        <div class="lz-notes" data-ref="notes" aria-hidden="true"></div>
        <div class="lz-flash" data-ref="flash" aria-hidden="true"></div>
      </div>
      <div class="lz-text">${bubble('LUIS')}</div>
    </div>
  </div>
  <div class="win lz-track" data-ref="after" hidden>
    <div class="win-bar"><div class="win-chip win-chip--caps">ATTACHED TRACK</div></div>
    <div class="lz-track-body">
      <div class="lz-track-head">
        <img class="lz-track-note" src="${noteUrl}" alt="" draggable="false">
        <div class="lz-track-id">
          <div class="lz-track-name">${TRACK.title}</div>
          <div class="lz-track-by">COMPOSED BY LUIS</div>
        </div>
        <span class="lz-track-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
      </div>
      <div class="lz-track-stats"><span>BACKEND CONTRIBUTIONS: <b class="is-zero">0</b> ·</span> <span>MUSICAL CONTRIBUTIONS: <b>1</b></span></div>
      <button class="key key--primary key--md lz-track-play" data-ref="play">PLAY TRACK</button>
    </div>
  </div>
`;

let assets = null;

// Starts downloading his sprites, riff and voice once; Debug Mode calls it on mount so the
// file opens without a wait. Decoded images are kept referenced so they stay decoded.
export function preloadLuis() {
  if (assets) return assets;
  const bytes = (url) => fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(url))));
  const images = [neutralUrl, crazyUrl, mouthUrl, wavesUrl, noteUrl, bolt1, bolt2, bolt3, bolt4].map((src) => {
    const img = new Image();
    img.src = src;
    return img.decode().then(() => img, () => img);
  });
  assets = { riff: bytes(riffUrl), voice: bytes(voiceUrl), images: Promise.all(images) };
  const retryLater = () => {
    assets = null;
  };
  assets.riff.catch(retryLater);
  assets.voice.catch(retryLater);
  return assets;
}

// Where the riff's entry sits in the decoded file: the steepest 20 ms rise within 45 ms of
// where it was measured. (MP3 decoders add a little priming silence, not all the same amount.)
function attackIn(buffer) {
  const data = buffer.getChannelData(0);
  const win = Math.round(buffer.sampleRate * 0.005);
  const env = [];
  for (let i = 0; i < Math.min(data.length, buffer.sampleRate * 0.5); i += win) {
    let sum = 0;
    for (let j = i; j < i + win && j < data.length; j++) sum += data[j] * data[j];
    env.push(Math.sqrt(sum / win));
  }
  let best = 0;
  let at = -1;
  const from = Math.round((ATTACK_FALLBACK - 0.045) / 0.005);
  const to = Math.round((ATTACK_FALLBACK + 0.045) / 0.005);
  for (let i = Math.max(2, from); i <= to && i + 2 < env.length; i++) {
    const rise = env[i + 2] - env[i - 2];
    if (rise > best) {
      best = rise;
      at = i;
    }
  }
  return at < 0 ? ATTACK_FALLBACK : at * 0.005;
}

export function mountLuis(host, { scope, onDone }) {
  host.innerHTML = scene;
  const ref = (name) => host.querySelector(`[data-ref="${name}"]`);
  const stage = ref('stage');
  const luis = ref('luis');
  const timers = new Set();
  const after = (ms, fn) => {
    const id = scope.after(ms, () => {
      timers.delete(id);
      fn();
    });
    timers.add(id);
    return id;
  };

  // One AudioContext for the riff and his voice, created inside the tap that opened the file.
  let ctx = null;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
  const files = preloadLuis();
  const copy = (promise) => promise.then((data) => data.slice(0)); // decodeAudioData detaches its input
  const voice = createSpeechAudio({
    src: voiceUrl,
    fetchData: () => copy(files.voice),
    createContext: () => {
      if (!ctx) throw new Error('Web Audio unavailable');
      return ctx;
    },
    volume: VOICE_VOLUME,
  });
  void voice.prepare(); // resumes the context while the gesture lasts, then decodes his voice
  music.hold('luis'); // on a replay, the song waits for the riff and his note, then resumes
  const riff = ctx ? copy(files.riff).then((data) => ctx.decodeAudioData(data)) : Promise.reject(new Error('audio'));
  riff.catch(() => {});
  const dialogue = createDialogue({
    scope,
    host,
    lines: LINES,
    voice,
    mouth: luis,
    anchor: ref('win'),
    onDone: () => after(dialogue.quiet() + DONE_DELAY, finish),
  });

  let phase = 'setup'; // setup | dark | riff | calm | talking | done (the stage's data-phase mirrors the first five)
  let disposed = false;
  let source = null;
  let settled = false;
  let noteSide = 1;

  function restart(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  // ── Setup: the log, then the lights go out ────────────────────────────

  SETUP.forEach((line, i) =>
    after(i * SETUP_STEP, () => {
      const div = document.createElement('div');
      div.textContent = line;
      ref('log').append(div);
    }),
  );
  const blackoutAt = (SETUP.length - 1) * SETUP_STEP + BLACKOUT_HOLD;
  after(blackoutAt, () => {
    phase = 'dark';
    stage.dataset.phase = 'dark';
  });

  // The first chord waits for the hum to build and for the riff and sprites to be ready.
  let armed = false;
  let loaded = null;
  let started = false;
  const go = () => {
    if (disposed || started || !armed || !loaded) return;
    started = true;
    begin(loaded.buffer);
  };
  after(blackoutAt + HUM, () => {
    armed = true;
    go();
  });
  const ready = Promise.all([files.images, riff.catch(() => null)]).then(([, buffer]) => buffer);
  Promise.race([ready, new Promise((resolve) => after(LOAD_CAP, () => resolve(null)))]).then((buffer) => {
    loaded = { buffer };
    go();
  });

  // ── The riff ──────────────────────────────────────────────────────────

  // Visuals are scheduled from the audio clock: the first chord's real position in the file,
  // plus the output latency. Without audio, the same choreography runs on the riff's length.
  function begin(buffer) {
    let attackMs = 0;
    let riffMs = RIFF_SECONDS * 1000;
    if (buffer && ctx && ctx.state === 'running') {
      const attack = attackIn(buffer);
      source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = RIFF_GAIN;
      source.connect(gain).connect(ctx.destination);
      const when = ctx.currentTime + 0.1;
      source.start(when);
      source.onended = settle;
      attackMs = (when - ctx.currentTime + attack + (ctx.outputLatency || ctx.baseLatency || 0)) * 1000;
      riffMs = (buffer.duration - attack) * 1000;
    }
    if (attackMs + THUMP * 1000 > 0) after(attackMs + THUMP * 1000, () => restart(host.querySelector('.lz-line'), 'is-thump'));
    after(attackMs, impact);
    for (const [t, kind, index] of SCORE) after(attackMs + t * 1000, () => fire(kind, index));
    after(attackMs + riffMs + 300, settle); // should `ended` never come
  }

  function impact() {
    phase = 'riff';
    stage.dataset.phase = 'riff';
    fire('strike', 0);
  }

  function bob(kind) {
    const el = ref('bob');
    el.classList.remove('is-bob', 'is-slam');
    void el.offsetWidth;
    el.classList.add(kind);
  }

  const pulse = () => restart(ref('pulse'), 'is-pulse');

  function fire(kind, index) {
    if (settled) return; // nothing fires once he has settled
    if (kind === 'strike') {
      restart(ref('flash'), 'is-on');
      restart(ref('glow'), 'is-pulse');
      STRIKES[index].forEach((id, i) => {
        const bolt = host.querySelector(`[data-bolt="${id}"]`);
        bolt.style.setProperty('--d', `${i * 45}ms`);
        restart(bolt, 'is-on');
      });
      bob('is-slam');
      pulse();
      spawnNote(-1);
      spawnNote(1);
      restart(ref('win'), 'shake');
    } else if (kind === 'chug') {
      bob('is-bob');
      pulse();
    } else {
      noteSide = -noteSide;
      spawnNote(noteSide, kind === 'echo');
      if (kind === 'note') pulse();
    }
  }

  function spawnNote(side, dim = false) {
    const note = document.createElement('img');
    note.className = dim ? 'lz-note lz-note--dim' : 'lz-note';
    note.src = noteUrl;
    note.alt = '';
    note.style.setProperty('--x', `${50 + side * (12 + Math.random() * 14)}%`);
    note.style.setProperty('--dx', `${side * (30 + Math.random() * 50)}px`);
    note.style.setProperty('--rot', `${side * (12 + Math.random() * 18)}deg`);
    note.style.setProperty('--w', `${dim ? 34 : 46 + Math.round(Math.random() * 18)}px`);
    note.addEventListener('animationend', () => note.remove());
    ref('notes').append(note);
  }

  // ── Calm: his neutral face, then his note ─────────────────────────────

  function settle() {
    if (settled || disposed) return;
    settled = true;
    source = null;
    phase = 'calm';
    stage.dataset.phase = 'calm'; // effects fade out, his face relaxes
    for (const el of host.querySelectorAll('.is-on, .is-pulse')) el.classList.remove('is-on', 'is-pulse');
    ref('bob').classList.remove('is-bob', 'is-slam');
    after(SETTLE_MS, () => {
      phase = 'talking';
      stage.dataset.phase = 'talking'; // every entrance layer is now display: none
      ref('notes').replaceChildren();
      ref('body').classList.add('is-talking');
      dialogue.start(400);
    });
  }

  // After "Hope you like it, mate.": the track he is talking about. The full song starts only
  // when David presses PLAY TRACK; the card's key follows the persistent player's state.
  let unsubscribe = null;
  const onPlay = () => music.toggle();
  function finish() {
    phase = 'done';
    const card = ref('after');
    card.hidden = false;
    card.classList.add('enter');
    music.prepare();
    const key = ref('play');
    key.addEventListener('click', onPlay);
    unsubscribe = music.subscribe(({ playing, time }) => {
      card.classList.toggle('is-playing', playing);
      key.textContent = playing ? 'PAUSE TRACK' : time > 0.5 ? 'RESUME TRACK' : 'PLAY TRACK';
    });
    music.release('luis');
    onDone?.();
  }

  const onClick = () => {
    if (phase === 'talking') dialogue.advance();
  };
  ref('body').addEventListener('click', onClick);

  return {
    dispose() {
      disposed = true;
      ref('body').removeEventListener('click', onClick);
      timers.forEach((id) => scope.stop(id));
      timers.clear();
      if (source) {
        source.onended = null;
        try {
          source.stop();
        } catch {
          // already stopped
        }
        source = null;
      }
      dialogue.dispose();
      voice.dispose(); // closes the shared context
      ref('play').removeEventListener('click', onPlay);
      unsubscribe?.();
      music.release('luis'); // leaving mid-entrance: the song carries on where it was
    },
  };
}

// A brief second appearance (the CSS rollback, crypt.js): Luis shrugging (luis-confused 1 and
// 2; the two frames alternate while he speaks, a hand-drawn boil), his bubble above him. No
// log, riff, bolts or song card, and the song is not held. Create it inside a tap (his voice
// unlocks there), then start() when the scene wants him to speak; the caller places and
// shows `host`.
const cameo = `
  <div class="lz-cameo">
    <div class="lz-cameo-text">${bubble('LUIS')}</div>
    <div class="lz-cameo-luis" data-ref="luis" role="img" aria-label="Luis, shrugging">
      <img class="lz-shrug" src="${confused1}" alt="" draggable="false">
      <img class="lz-shrug lz-shrug--2" src="${confused2}" alt="" draggable="false">
    </div>
  </div>
`;

let cameoImages = null;
export function preloadLuisCameo() {
  if (cameoImages) return;
  cameoImages = [confused1, confused2].map((src) => {
    const img = new Image();
    img.src = src;
    img.decode().catch(() => {});
    return img;
  });
}

export function mountLuisCameo(host, { scope, lines, onDone }) {
  host.innerHTML = cameo;
  const files = preloadLuis();
  const voice = createSpeechAudio({
    src: voiceUrl,
    fetchData: () => files.voice.then((data) => data.slice(0)), // decodeAudioData detaches its input
    volume: VOICE_VOLUME,
  });
  void voice.prepare();
  let phase = 'waiting'; // waiting | talking | done
  const dialogue = createDialogue({
    scope,
    host,
    lines,
    voice,
    mouth: host.querySelector('[data-ref="luis"]'),
    anchor: host.firstElementChild,
    onDone: () => {
      phase = 'done';
      scope.after(dialogue.quiet() + DONE_DELAY, () => onDone?.());
    },
  });
  const onClick = () => {
    if (phase !== 'talking') return;
    void voice.prepare();
    dialogue.advance();
  };
  host.addEventListener('click', onClick);
  return {
    start(lockMs = 0) {
      phase = 'talking';
      dialogue.start(lockMs);
    },
    dispose() {
      host.removeEventListener('click', onClick);
      dialogue.dispose();
      voice.dispose();
    },
  };
}
