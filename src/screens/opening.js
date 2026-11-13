import talkingSound from '../assets/talking-sound.mp3';
import { createSpeechAudio } from '../speechAudio.js';
import { createDialogue, bubble } from '../dialogue.js';

// Beat 1, before any button: Sofi is asleep at her post. Six quick taps wake her
// (008-are-u-still-here poses), then she talks (004-talking + her original voice) and,
// after her last line, smirks, teases and giggles (009-i-see-you) before the choices appear.
// The bubble, typewriter and voice timing live in dialogue.js, shared with Luis.

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
      ${bubble('SOFI')}
    </div>
  </div>
`;

// `lines` replaces the dialogue and `awake` skips the wake-up (Sofi starts talking at once);
// both are used for her Debug Mode introduction.
export function mountOpening(host, { scope, onWake, onDone, lines = LINES, awake = false }) {
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
  const dialogue = createDialogue({ scope, host, lines, voice, mouth: spriteEl, anchor: op, onDone: react });

  let phase = 'asleep'; // asleep | waking | talking | reacting | done
  let taps = [];
  let shown = 0; // level on screen (lags behind while she dozes off)
  let dozeTimer = null;

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

  function startTalking() {
    phase = 'talking';
    spriteEl.dataset.sofi = 'talking';
    spriteEl.classList.remove('is-poked');
    delete spriteEl.dataset.lids;
    ref('wait').hidden = true;
    sofi.setAttribute('aria-label', 'Sofi is talking. Tap to continue.');
    dialogue.start(900); // the last wake-up taps must not skip her first line
  }

  // Right after "...the most obvious option.": smirk → tease → giggle → smirk, then the choices.
  function react() {
    phase = 'reacting';
    sofi.disabled = true;
    sofi.removeAttribute('aria-label');
    let at = dialogue.quiet() + REACTION_DELAY; // once her voice has faded
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
    else if (phase === 'talking') dialogue.advance();
  };
  op.addEventListener('click', onClick);

  if (awake) {
    void voice.prepare(); // still inside the tap that opened this screen
    startTalking();
  }

  return {
    dispose() {
      op.removeEventListener('click', onClick);
      stopDoze();
      dialogue.dispose();
      voice.dispose();
    },
  };
}
