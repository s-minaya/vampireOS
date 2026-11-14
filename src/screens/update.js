import { createScope, onAction } from '../util.js';
import { mountOpening } from './opening.js';

// Beats 1 and 2: the Mandatory Birthday Update and its failure at 99%.

const SEGMENTS = 20;

const frame = `
  <div class="glow" aria-hidden="true"></div>
  <div class="arch" data-ref="arch" aria-hidden="true">
    <svg class="arch-crown" viewBox="0 0 390 322" width="390" height="322">
      <path d="M24 322 L24 320 A342 342 0 0 1 195 23.8 A342 342 0 0 1 366 320 L366 322" fill="none" stroke="#eadfcf" stroke-width="2"/>
      <path d="M32 322 L32 320 A334 334 0 0 1 195 33.1 A334 334 0 0 1 358 320 L358 322" fill="none" stroke="#6b1f2e" stroke-width="1"/>
      <circle cx="195" cy="92" r="26" fill="none" stroke="#eadfcf" stroke-width="1.5"/>
      <circle cx="195" cy="82" r="10" fill="none" stroke="#eadfcf" stroke-width="1.5"/>
      <circle cx="205" cy="92" r="10" fill="none" stroke="#eadfcf" stroke-width="1.5"/>
      <circle cx="195" cy="102" r="10" fill="none" stroke="#eadfcf" stroke-width="1.5"/>
      <circle cx="185" cy="92" r="10" fill="none" stroke="#eadfcf" stroke-width="1.5"/>
      <rect x="191" y="88" width="8" height="8" transform="rotate(45 195 92)" fill="#c8102e"/>
      <path class="crack" d="M195 24 L187 52 L200 80 L184 112 L196 140" fill="none" stroke="#ff4d5e" stroke-width="2"/>
    </svg>
    <div class="arch-legs"></div>
    <div class="arch-legs arch-legs--in"></div>
    <svg class="crack crack--left" viewBox="0 0 46 70" width="46" height="70"><path d="M1 1 L27 15 L17 45 L43 67" fill="none" stroke="#ff4d5e" stroke-width="2"/></svg>
    <svg class="crack crack--right" viewBox="0 0 28 46" width="28" height="46"><path d="M27 1 L3 17 L13 43" fill="none" stroke="#ff4d5e" stroke-width="2"/></svg>
    <div class="stuck stuck--a"></div>
    <div class="stuck stuck--b"></div>
    <div class="stuck stuck--c"></div>
  </div>
  <div class="flash" data-ref="flash" aria-hidden="true"></div>
  <div class="u-content">
    <div class="wordmark" data-ref="mark">VampireOS</div>
    <div class="buildline">BUILD 666 · 15.11.2026</div>
    <div class="u-main" data-ref="main"></div>
  </div>
  <div data-ref="overlay"></div>
`;

const setup = (animate, asleep = false) => `
  <div class="boot ${animate ? 'boot--animate' : ''}">
    <div class="boot-line" style="--i:0">&gt; Initializing birthday protocol...</div>
    <div class="boot-line" style="--i:1">&gt; ABAP runtime: <span class="c-bone">detected</span></div>
    <div class="boot-line" style="--i:2">&gt; Emotional availability: <span class="c-red">unknown</span></div>
    <div class="boot-line" style="--i:3">&gt; Romantic vampire mode: <span class="c-bone">enabled</span></div>
    <div class="boot-line" style="--i:4">&gt; Frontend developer: <span class="c-pink" data-ref="dev">${asleep ? 'asleep' : 'confused'}</span></div>
  </div>
  <div class="win u-win ${animate ? 'u-win--late' : ''}">
    <div class="win-bar"><div class="win-chip win-chip--caps">SYSTEM UPDATE</div></div>
    <div data-ref="body"></div>
  </div>
`;

// Revealed only once Sofi has finished reacting: first ACCEPT MY FATE, red and flashing
// (the most obvious option), then a plain I REFUSE underneath.
const promptBody = `
  <div class="u-prompt enter">
    <div class="overline">MANDATORY BIRTHDAY</div>
    <div class="u-headline">Update</div>
    <p class="voice u-lede">A birthday update has been prepared in your honour, David. Installation is mandatory; your consent is a formality.</p>
    <div class="u-guide" data-ref="guide"></div>
    <div class="u-choices" data-ref="choices">
      <button class="key key--primary key--lg u-accept u-beckon is-pending" data-act="accept">ACCEPT MY FATE</button>
      <button class="key u-refuse is-pending" data-act="refuse">I REFUSE</button>
    </div>
  </div>
`;

const CHOICE_DELAY = 450; // after the prompt slides in
const REFUSE_DELAY = 900; // I REFUSE arrives after ACCEPT MY FATE

const revokedNote = '<p class="voice u-revoked enter" role="status">The option to refuse has been removed for your convenience.</p>';

const progressBar = (extraClass = '') => `
  <div class="bar ${extraClass}" data-ref="bar" role="progressbar" aria-label="Installation progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
    ${'<div class="bar-seg"></div>'.repeat(SEGMENTS)}
  </div>
`;

const installBody = `
  <div class="u-install">
    <div class="overline">INSTALLING BIRTHDAY PATCH</div>
    <div class="u-percent" data-ref="pct">0%</div>
    ${progressBar()}
    <div class="u-status" data-ref="status"><span class="voice c-dim">Please do not turn off your coffin.</span></div>
  </div>
`;

const failedBlock = (retried) => `
  <div class="u-failed shake">
    <div class="fatal-band"><span>FATAL: BARBARIDAD_EXCEPTION</span><span class="cursor" aria-hidden="true"></span></div>
    <div class="u-dead">
      <div class="u-dead-pct glitch">99%</div>
      ${progressBar('bar--dead')}
    </div>
    <div class="log">
      <div>&gt; Birthday patch installation failed.</div>
      <div>&gt; Root cause: <span class="c-pink">Sofi</span> touched the backend.</div>
      <div>&gt; Backend developer assistance required.</div>
    </div>
    ${retried ? '<div class="voice c-dim u-retried">Restart attempted. The outcome has not improved.</div>' : ''}
    <button class="key" data-act="restart">RESTART UPDATE</button>
    <button class="key key--primary key--md" data-act="debug">ENTER DEBUG MODE</button>
  </div>
`;

// PENDING DECISION (VAMPIREOS.md): the exact ARE YOU SURE? microcopy. Approved flow:
// YES on accept installs; YES on refuse discards the objection and removes I REFUSE;
// NO returns to the choices.
const sureAlert = `
  <div class="modal">
    <div class="alert pop" role="alertdialog" aria-label="Are you sure?">
      <div class="alert-bar">VAMPIREOS</div>
      <div class="alert-body">
        <div class="alert-title">ARE YOU SURE?</div>
        <div class="placeholder-line">[ confirmation copy pending ]</div>
        <div class="alert-actions">
          <button class="key key--primary" data-act="yes">YES</button>
          <button class="key" data-act="no">NO</button>
        </div>
      </div>
    </div>
  </div>
`;

const discardedAlert = `
  <div class="modal">
    <button class="alert alert--tap pop" data-act="dismiss" aria-label="Your objection has been carefully considered and discarded. Dismiss.">
      <span class="alert-bar">VAMPIREOS</span>
      <span class="alert-quote voice">Your objection has been carefully considered and discarded.</span>
      <span class="alert-drain" aria-hidden="true"></span>
    </button>
  </div>
`;

export function mountUpdate(root, app) {
  const scope = createScope();
  const state = { intent: '', opener: null, opening: null, attempts: 0, dismissTimer: null, ticker: null };
  root.innerHTML = frame;
  const ref = (name) => root.querySelector(`[data-ref="${name}"]`);

  function paintBar(pct, stalled) {
    const bar = ref('bar');
    if (!bar) return;
    const filled = Math.floor(pct / 5);
    bar.setAttribute('aria-valuenow', String(pct));
    [...bar.children].forEach((seg, i) => {
      seg.classList.toggle('is-on', i < filled);
      seg.classList.toggle('is-stuck', stalled && i === SEGMENTS - 1);
    });
  }

  function showPrompt(animate) {
    // Sofi first: asleep in the update window, where the choices will be.
    ref('main').innerHTML = setup(animate, true);
    state.opening = mountOpening(ref('body'), {
      scope,
      onWake: () => {
        const dev = ref('dev');
        if (!dev) return;
        dev.textContent = 'confused';
        dev.classList.add('glitch');
        scope.after(1300, () => dev.classList.remove('glitch'));
      },
      onDone: revealChoices,
    });
  }

  // After her last line, the window shows the update prompt; she stays, smaller, beside the choices.
  function revealChoices(guide) {
    ref('body').innerHTML = promptBody;
    guide.classList.add('is-compact');
    ref('guide').append(guide);
    const choices = ref('choices');
    choices.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const [accept, refuse] = choices.querySelectorAll('button');
    scope.after(CHOICE_DELAY, () => {
      accept.classList.replace('is-pending', 'pop');
      accept.focus({ preventScroll: true });
    });
    scope.after(CHOICE_DELAY + REFUSE_DELAY, () => refuse.classList.replace('is-pending', 'enter'));
  }

  function closeOverlay() {
    if (state.dismissTimer) scope.stop(state.dismissTimer);
    state.dismissTimer = null;
    ref('overlay').innerHTML = '';
    document.removeEventListener('keydown', onEscape);
  }

  function onEscape(event) {
    if (event.key !== 'Escape') return;
    if (state.intent === 'discarded') removeRefusal();
    else cancelSure();
  }

  function openSure(intent, opener) {
    state.intent = intent;
    state.opener = opener;
    ref('overlay').innerHTML = sureAlert;
    ref('overlay').querySelector('button').focus({ preventScroll: true });
    document.addEventListener('keydown', onEscape);
  }

  function cancelSure() {
    closeOverlay();
    state.opener?.focus({ preventScroll: true });
  }

  // The objection is discarded, then so is the option itself: only acceptance remains.
  function removeRefusal() {
    closeOverlay();
    state.intent = '';
    const refuse = root.querySelector('[data-act="refuse"]');
    const accept = root.querySelector('[data-act="accept"]');
    if (!refuse || !accept) return;
    refuse.disabled = true;
    refuse.classList.add('is-revoked');
    scope.after(650, () => {
      refuse.remove();
      accept.insertAdjacentHTML('afterend', revokedNote);
      accept.focus({ preventScroll: true });
    });
  }

  function install(fast) {
    closeOverlay();
    if (state.opening) {
      state.opening.dispose();
      state.opening = null;
    }
    if (state.ticker) scope.stop(state.ticker);
    ref('mark').classList.remove('glitch');
    ref('arch').classList.remove('arch--cracked');
    ref('main').innerHTML = setup(false);
    ref('body').innerHTML = installBody;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let pct = 0;
    state.ticker = scope.every(70, () => {
      pct += fast ? 7 : pct < 60 ? 3 : pct < 88 ? 2 : 1;
      if (pct >= 99) {
        scope.stop(state.ticker);
        state.ticker = null;
        ref('pct').textContent = '99%';
        paintBar(99, true);
        ref('status').innerHTML = '<span class="u-eta enter">Estimated time remaining: emotionally unavailable.</span>';
        scope.after(fast ? 1200 : 2600, fail);
        return;
      }
      ref('pct').textContent = `${pct}%`;
      paintBar(pct, false);
    });
  }

  function fail() {
    state.attempts += 1;
    ref('main').innerHTML = failedBlock(state.attempts > 1);
    paintBar(99, true);
    ref('mark').classList.add('glitch');
    ref('arch').classList.add('arch--cracked');
    const flash = ref('flash');
    flash.classList.remove('is-firing');
    void flash.offsetWidth;
    flash.classList.add('is-firing');
  }

  const off = onAction(root, {
    accept: (el) => openSure('accept', el),
    refuse: (el) => openSure('refuse', el),
    no: cancelSure,
    yes: () => {
      if (state.intent === 'accept') {
        install(false);
        return;
      }
      state.intent = 'discarded';
      ref('overlay').innerHTML = discardedAlert;
      ref('overlay').querySelector('button').focus({ preventScroll: true });
      state.dismissTimer = scope.after(2600, removeRefusal);
    },
    dismiss: removeRefusal,
    restart: () => install(true),
    debug: () => app.go('debug'), // Sofi's introduction plays there if it has not been heard yet
  });

  showPrompt(true);

  return () => {
    off();
    document.removeEventListener('keydown', onEscape);
    if (state.opening) state.opening.dispose();
    scope.dispose();
  };
}
