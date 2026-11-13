import talkingSound from '../assets/talking-sound.mp3';
import { createSpeechAudio } from '../speechAudio.js';

// Beat 1, before any button: Sofi is asleep at her post. Six quick taps wake her
// (008-are-u-still-here poses), then she talks (004-talking + her original voice) and,
// after her last line, smirks, teases and giggles (009-i-see-you) before the choices appear.

// Approved dialogue (provisional English; Sofi will adapt it to Spanish). One bubble per paragraph.
const LINES = [
  'Oh! David! You scared me!',
  'Right. Your birthday. I knew I was forgetting something.',
  'I made you a present. An entire operating system, actually.',
  'Now, a tiny warning: I designed the interface myself, and it may not have your best interests at heart.',
  "So... maybe don't trust the most obvious option.",
];

const WAKE_TAPS = 6;
const WAKE_WINDOW = 4000; // the six taps must fall within this many ms
const DOZE_AFTER = 2000; // without a tap for this long, she falls asleep again
const DOZE_STEP = 240; // one meter segment drains per step while she dozes off
const STARTLED_MS = 1000;

// Typewriter timing, from SofiSpeech's speechTimeline, slightly slowed for a phone.
const TYPE = { start: 380, char: 34, short: 190, long: 380 };
const READ = (text) => 1400 + text.length * 34; // pause before the next bubble

// 009-i-see-you reaction after the last line, with the original state durations (ms).
const REACTION = [['smirk', 900], ['tease', 1300], ['giggle', 1200], ['smirk', 800]];
const REACTION_DELAY = 150; // beat between her voice fading and the smirk

// What each number of taps looks like.
const LEVELS = [
  { pose: 'asleep', word: 'ASLEEP' },
  { pose: 'asleep', word: 'STIRRING' },
  { pose: 'asleep', word: 'STIRRING' },
  { pose: 'nodding', word: 'GROGGY' },
  { pose: 'drowsy', lids: 'heavier', word: 'DROWSY' },
  { pose: 'drowsy', lids: 'heavy', word: 'ALMOST AWAKE' },
  { pose: 'startled', word: 'AWAKE' },
];

const HINTS = [
  'Your guide has dozed off at her post. The ceremony cannot commence until she is roused.',
  'She has drifted off again. Persistence, David; she sleeps like the dead.',
];

const sprite = `
  <span class="sofi-sprite" data-sofi="asleep" aria-hidden="true">
    <span data-layer="body"><span data-layer="pose"></span><span data-layer="lids"></span><span data-layer="mouth"></span></span>
    <span data-layer="talk"></span>
    <span data-layer="face"></span><span data-layer="sparkle"></span>
    <span data-layer="z1"></span><span data-layer="z2"></span><span data-layer="z3"></span>
    <span data-layer="burst"></span>
  </span>
`;

const scene = `
  <div class="op" data-ref="op">
    <button type="button" class="op-sofi" data-ref="sofi" aria-label="Sofi is asleep. Tap her quickly, six times, to wake her.">${sprite}</button>
    <div class="op-ground" aria-hidden="true"></div>
    <div class="op-text">
      <div class="op-wait" data-ref="wait">
        <div class="op-status"><span>&gt; OPERATOR:</span> <span class="c-pink" data-ref="word">ASLEEP</span></div>
        <div class="op-meter" data-ref="meter" aria-hidden="true">${'<span></span>'.repeat(WAKE_TAPS)}</div>
        <p class="voice op-hint" data-ref="hint" aria-live="polite">${HINTS[0]}</p>
      </div>
      <div class="op-bubble" data-ref="bubble" hidden>
        <span class="op-tail" aria-hidden="true"></span>
        <span class="op-name" aria-hidden="true">SOFI</span>
        <span class="op-type">
          <span class="op-ghost" data-ref="ghost" aria-hidden="true"></span>
          <span class="op-typed" aria-hidden="true"><span data-ref="typed"></span><span class="op-caret" data-ref="caret"></span></span>
        </span>
        <span class="op-next" data-ref="next" aria-hidden="true"></span>
        <span class="sr-only" data-ref="live" aria-live="polite"></span>
      </div>
    </div>
  </div>
`;

function charKind(char) {
  if ('.…:?!'.includes(char)) return 'long';
  if (',;'.includes(char)) return 'short';
  if (/\s/.test(char)) return 'space';
  return 'letter';
}

export function mountOpening(host, { scope, onWake, onDone }) {
  host.innerHTML = scene;
  const ref = (name) => host.querySelector(`[data-ref="${name}"]`);
  const op = ref('op');
  const sofi = ref('sofi');
  const spriteEl = host.querySelector('.sofi-sprite');
  const segments = [...ref('meter').children];

  // Fetched now, decoded on the first tap (Web Audio needs a gesture). Never blocks the scene.
  const soundData = fetch(talkingSound).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('voice'))));
  soundData.catch(() => {});
  const voice = createSpeechAudio({ src: talkingSound, fetchData: () => soundData });

  let phase = 'asleep'; // asleep | waking | talking | done
  let taps = [];
  let shown = 0; // level on screen (lags behind while she dozes off)
  let dozeTimer = null;
  let typeTimer = null;
  let readTimer = null;
  let page = 0;
  let speaking = false;
  let quietTimer = null;
  let quietAt = 0; // when her voice has fully faded (performance.now() ms)
  let lockedUntil = 0;

  function paint(level, word) {
    const look = LEVELS[level];
    shown = level;
    spriteEl.dataset.sofi = look.pose;
    if (look.lids) spriteEl.dataset.lids = look.lids;
    else delete spriteEl.dataset.lids;
    segments.forEach((seg, i) => seg.classList.toggle('is-on', i < level));
    ref('word').textContent = word || look.word;
  }

  function restart(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  function stopDoze() {
    if (dozeTimer) scope.stop(dozeTimer);
    dozeTimer = null;
  }

  function poke() {
    void voice.prepare(); // unlocks audio inside the gesture
    try {
      navigator.vibrate?.(12);
    } catch {
      // Vibration is a nicety.
    }
    const now = performance.now();
    stopDoze();
    taps = taps.filter((t) => now - t < WAKE_WINDOW);
    taps.push(now);
    if (taps.length >= WAKE_TAPS) {
      wake();
      return;
    }
    paint(taps.length);
    restart(spriteEl, 'is-poked');
    restart(ref('meter'), 'is-poked');
    dozeTimer = scope.after(DOZE_AFTER, dozeOff);
  }

  // She gives up and slides back to sleep, one segment at a time. Progress is reset at once.
  function dozeOff() {
    taps = [];
    const step = () => {
      const next = shown - 1;
      if (next <= 0) {
        paint(0);
        dozeTimer = null;
        ref('hint').textContent = HINTS[1];
        return;
      }
      paint(next, 'DOZING OFF');
      dozeTimer = scope.after(DOZE_STEP, step);
    };
    step();
  }

  function wake() {
    phase = 'waking';
    stopDoze();
    taps = [];
    paint(6);
    ref('meter').classList.add('is-full');
    sofi.setAttribute('aria-label', 'Sofi');
    onWake?.();
    scope.after(STARTLED_MS, startTalking);
  }

  // ── Dialogue ──────────────────────────────────────────────────────────

  // The mouth opens with the voice and closes when the voice has actually faded
  // (it finishes its syllable, at most ~150 ms into the pause).
  function setSpeaking(on) {
    if (speaking === on) return;
    speaking = on;
    if (quietTimer) scope.stop(quietTimer);
    quietTimer = null;
    if (on) {
      spriteEl.classList.add('is-speaking');
      voice.startVoice();
      return;
    }
    const tail = voice.stopVoice() || 0;
    quietAt = performance.now() + tail;
    if (tail > 0) {
      quietTimer = scope.after(tail, () => {
        quietTimer = null;
        spriteEl.classList.remove('is-speaking');
      });
    } else {
      spriteEl.classList.remove('is-speaking');
    }
  }

  function startTalking() {
    phase = 'talking';
    spriteEl.dataset.sofi = 'talking';
    spriteEl.classList.remove('is-poked');
    delete spriteEl.dataset.lids;
    ref('wait').hidden = true;
    ref('bubble').hidden = false;
    ref('bubble').classList.add('pop');
    sofi.setAttribute('aria-label', 'Sofi is talking. Tap to continue.');
    lockedUntil = performance.now() + 900; // the last wake-up taps must not skip her first line
    playPage();
  }

  function playPage() {
    const text = LINES[page];
    let index = 0;
    ref('ghost').textContent = text; // reserves this bubble's final size while she types
    op.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    ref('typed').textContent = '';
    ref('caret').hidden = false;
    ref('next').classList.remove('is-on');
    ref('live').textContent = text;

    const tick = () => {
      index += 1;
      const kind = charKind(text.charAt(index - 1));
      const done = index >= text.length;
      const pause = kind === 'long' || kind === 'short';
      // Voice and mouth move with the letters and stop at every pause, as in SofiSpeech.
      setSpeaking(done || pause ? false : kind === 'letter' ? true : speaking);
      ref('typed').textContent = text.slice(0, index);
      if (done) {
        typeTimer = null;
        pageDone();
        return;
      }
      typeTimer = scope.after(kind === 'long' ? TYPE.long : kind === 'short' ? TYPE.short : TYPE.char, tick);
    };
    typeTimer = scope.after(TYPE.start, tick);
  }

  function pageDone() {
    setSpeaking(false);
    ref('caret').hidden = true;
    if (page === LINES.length - 1) {
      react();
      return;
    }
    ref('next').classList.add('is-on');
    readTimer = scope.after(READ(LINES[page]), nextPage);
  }

  function nextPage() {
    if (readTimer) scope.stop(readTimer);
    readTimer = null;
    page += 1;
    playPage();
  }

  // A tap while she types shows the whole bubble; a tap on a finished bubble moves on.
  function advance() {
    const now = performance.now();
    if (now < lockedUntil) return;
    lockedUntil = now + 250;
    if (typeTimer) {
      scope.stop(typeTimer);
      typeTimer = null;
      ref('typed').textContent = LINES[page];
      pageDone();
    } else if (readTimer) {
      nextPage();
    }
  }

  // Right after "...the most obvious option.": smirk → tease → giggle → smirk, then the choices.
  function react() {
    phase = 'reacting';
    sofi.disabled = true;
    sofi.removeAttribute('aria-label');
    let at = Math.max(0, quietAt - performance.now()) + REACTION_DELAY;
    for (const [face, ms] of REACTION) {
      scope.after(at, () => {
        spriteEl.classList.remove('is-speaking');
        spriteEl.dataset.sofi = face;
      });
      at += ms;
    }
    scope.after(at, () => {
      phase = 'done';
      spriteEl.dataset.sofi = 'talking'; // back to rest: mouth closed, blinking
      onDone?.(op);
    });
  }

  const onClick = (event) => {
    if (phase === 'asleep' && event.target.closest('[data-ref="sofi"]')) poke();
    else if (phase === 'talking') advance();
  };
  op.addEventListener('click', onClick);

  // Never leave her voice looping in a background tab.
  const onVisibility = () => {
    if (document.hidden) setSpeaking(false);
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    dispose() {
      op.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
      [dozeTimer, typeTimer, readTimer, quietTimer].forEach((id) => id && scope.stop(id));
      setSpeaking(false);
      voice.dispose();
    },
  };
}
