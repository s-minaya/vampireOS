import { createScope, onAction, escapeHtml } from '../util.js';
import { mountOpening } from './opening.js';
import { mountLuisCameo, preloadLuis, preloadLuisCameo } from './luis.js';
import { icons } from './debug.js';
import { preloadLetter } from './letter.js';
import needsContext from '../assets/needs-context.webp';
import needsContextQuestion from '../assets/needs-context-question.webp';
import suspicious from '../assets/suspicious.webp';
import suspiciousFace from '../assets/suspicious-face.webp';

// Beat 4: The Commit Crypt. Four ROLL BACKs, each undoing the newest commit, each with its
// consequence on screen before anyone speaks: David's fix goes and the bug is back (this is
// the past), the deleted letter is back in the historical tree (still locked), "add vampires"
// goes and every style with it, and the initial commit is the only version that ever worked.
// Sofi comments on the first two, Sofi and Luis on the third, nobody on the last. The
// characters are created inside the ROLL BACK tap (their voices unlock there) and placed into
// the older version once the reset sweep has passed. A reload lands on the newest version.

const COMMITS = [
  { hash: '7a1e0f1', who: 'David', msg: 'fix: false → true', aside: '' },
  { hash: 'dead1e7', who: 'Sofi', msg: 'delete birthday_letter.txt', aside: "don't ask." },
  { hash: 'b100d15', who: 'Sofi', msg: 'add vampires', aside: 'everything is better with vampires.' },
  { hash: '05c0ded', who: 'Sofi', msg: 'what if this was an entire operating system', aside: 'also touched the backend. how hard can it be.' },
  { hash: '0000001', who: 'Sofi', msg: 'happy birthday, david', aside: '' },
];
const ORIGIN = COMMITS.length - 1; // four rollbacks
const NAKED = ORIGIN - 1; // "add vampires" undone: no gothic.css

// What the system reports after each rollback (index = commits undone).
const STATUS = {
  1: ['> Reverted "fix: false → true".', "> This is an older version. David's fix does not exist here yet."],
  2: ['> Reverted "delete birthday_letter.txt".', '> Restored: gift/birthday_letter.txt. Locked in this version as well.'],
  3: ['Reverted "add vampires". gothic.css no longer exists.'],
};

// Approved dialogue (provisional English; Sofi will adapt it to Spanish). One bubble per line.
const BUG_LINES = [
  "You're not breaking it again. You're looking at an older version.",
  'Every rollback takes us one step further into my questionable decisions.',
  "Please don't judge me by the commit messages.",
];
const LETTER_LINES = ['Oh.', "That's... not supposed to be there.", 'I mean, it was supposed to be there. At some point.', "Anyway, it's still inaccessible. We should probably keep going."];
const THEME_SOFI = 'Luis broke the CSS.';
const THEME_LUIS = "I don't even know what CSS is. I made you a song.";
const THEME_SOFI_AFTER = '...which is considerably more useful than whatever I was doing.';

const WIPE = 520; // the reset sweep, before the older version is drawn
const BEAT = 900; // the consequence alone on screen before anyone appears
const SUSPICIOUS_MS = 3500; // 013-suspicious, one pass: side-eye at the error, a knowing smile, she straightens
const REVEAL_DELAY = 600; // after the last word, before ROLL BACK appears
const DUSK = 450; // the initial commit fades before the letter opens
// Before "Oh.": she appears looking at the file, tilts her head («?»), jolts. [pose, ms until the next]
const LETTER_BEATS = [['talking', 600], ['puzzled', 900], ['startled', 700]];

const treeText = (depth) => (depth >= 2 ? 'gift/ · 1 item · birthday_letter.txt' : 'gift/ · 0 items');

const strip = '<div class="strip strip--fatal enter"><span>FATAL: BARBARIDAD_EXCEPTION</span><span class="cursor" aria-hidden="true"></span></div>';

// Copy I, verbatim, and what ROLL BACK does (it is not a puzzle).
const sofiNote = `
  <div class="sofi-note">
    <div>Don't panic, David. I know you're not used to seeing this at work.</div>
    <div>For your birthday, I've included Git. You're welcome. — Sofi</div>
  </div>`;
const rollHint = '<p class="voice c-dim commit-hint">ROLL BACK shows the version before this one. There is nothing to fix there, only to look.</p>';

// The second rollback's find: the folder that was empty, with the letter back in it, still locked.
const letterWin = `
  <div class="win enter">
    <div class="win-bar"><div class="win-chip">/vampireos/gift</div></div>
    <div class="row row--last c-found">
      ${icons.file('#f5a3c1')}
      <div class="row-text"><div class="row-name c-pink">birthday_letter.txt</div><div class="row-meta c-red">locked: BARBARIDAD_EXCEPTION</div></div>
      ${icons.lock}
    </div>
    <div class="win-status win-status--bright"><span>1 item</span><span>restored</span></div>
  </div>`;

function gothic(depth) {
  const top = COMMITS[depth];
  const broken = depth >= 1; // without David's fix, every older version has the bug
  const sealed = COMMITS.slice(depth + 1)
    .map((c) => `<div class="sealed"><i aria-hidden="true"></i><span>${c.hash}</span><b aria-hidden="true"></b><span>${c.who}</span></div>`)
    .join('');
  const status = (STATUS[depth] || []).map((line) => `<div>${escapeHtml(line)}</div>`).join('');
  return `
    <div class="glow glow--low" aria-hidden="true"></div>
    ${broken ? strip : ''}
    <div class="c-content">
      <header class="git-head">
        <div class="voice c-dim git-presents">VampireOS proudly presents</div>
        <h1 class="git-title ${broken ? 'glitch glitch--wide' : ''}">Git</h1>
        <div class="git-ribbon">PREMIUM BIRTHDAY FEATURE</div>
      </header>
      ${depth === 0 ? sofiNote : `<div class="git-status" role="status">${status}</div>`}
      ${depth === 2 ? letterWin : ''}
      <div class="c-slot" data-ref="guide-slot"></div>
      <div class="win commit">
        <div class="commit-meta"><span>HEAD · ${top.hash}</span><span class="${top.who === 'Sofi' ? 'c-pink' : 'c-bone'}">${top.who}</span></div>
        <div class="commit-msg">${escapeHtml(top.msg)}</div>
        ${top.aside ? `<div class="commit-aside">${escapeHtml(top.aside)}</div>` : ''}
        <button class="key key--primary commit-roll ${depth ? 'is-pending' : ''}" data-act="roll">ROLL BACK</button>
        ${depth === 0 ? rollHint : ''}
      </div>
      <div class="sealed-list">${sealed}</div>
      <div class="tree"><span>working tree</span><span class="${depth >= 2 ? 'c-pink' : ''}">${treeText(depth)}</span></div>
    </div>
  `;
}

// The same screen with "add vampires" undone: unstyled HTML. The bug is still in this version.
function naked(depth) {
  const top = COMMITS[depth];
  const older = COMMITS.slice(depth + 1).map((c) => `<li>${c.hash} — ${c.who}</li>`).join('');
  return `
    <div class="naked">
      <p>VampireOS proudly presents</p>
      <h1>Git</h1>
      <p>PREMIUM BIRTHDAY FEATURE</p>
      <hr />
      <h2>GOTHIC THEME REMOVED</h2>
      <p role="status">${escapeHtml(STATUS[depth][0])}</p>
      <p><b>FATAL: BARBARIDAD_EXCEPTION</b> (still present in this version)</p>
      <div class="c-slot" data-ref="guide-slot"></div>
      <div class="c-slot" data-ref="luis-slot"></div>
      <p class="naked-head"><b>HEAD</b> ${top.hash} — ${top.who}</p>
      <p class="naked-msg">${escapeHtml(top.msg)}</p>
      ${top.aside ? `<p><i>${escapeHtml(top.aside)}</i></p>` : ''}
      <button class="naked-btn is-pending" data-act="roll">ROLL BACK</button>
      <ul>${older}</ul>
      <p>working tree: ${treeText(depth)}</p>
    </div>
  `;
}

// Copy J, verbatim.
const origin = `
  <div class="origin">
    <div class="origin-card dawn">
      <div class="origin-label">INITIAL COMMIT</div>
      <div>Author: Sofi</div>
      <div>Files changed: 1</div>
      <div>Bugs introduced: <span class="origin-zero">0</span></div>
      <div class="origin-gap"></div>
      <div>Commit message:</div>
      <div class="origin-msg">"happy birthday, david"</div>
    </div>
    <button class="calm-btn dawn dawn--2" data-act="open">Open birthday_letter.txt</button>
  </div>
`;

const wipe = `
  <div class="wipe" aria-hidden="true">
    <div class="wipe-bar"></div>
    <div class="wipe-cmd">$ git reset --hard HEAD~1</div>
  </div>
`;

// Her crypt frames, decoded on arrival so none pops in (the opening's sprites are already here).
let frames = null;
function preloadFrames() {
  if (frames) return;
  frames = [needsContext, needsContextQuestion, suspicious, suspiciousFace].map((src) => {
    const img = new Image();
    img.src = src;
    img.decode().catch(() => {});
    return img;
  });
}

export function mountCrypt(root, app) {
  const scope = createScope();
  const state = { depth: 0, busy: false };
  let scene = null; // the characters of the version on screen

  const slot = (name) => root.querySelector(`[data-ref="${name}"]`);

  function revealKey() {
    const key = root.querySelector('[data-act="roll"]');
    if (!key) return;
    key.classList.remove('is-pending');
    key.classList.add('pop');
    key.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Sofi's row: mounted at once, hidden, and placed into the next version by the scene's attach().
  function guideRow(local, options) {
    const host = document.createElement('div');
    host.className = 'c-guide';
    host.hidden = true;
    const sofi = mountOpening(host, { scope: local, awake: true, compact: true, reaction: false, ...options });
    return { host, sofi };
  }

  // 1 · David's fix undone: the bug is back. She eyes the error («mmm, I see»), then explains;
  // her shoulders drop at her questionable decisions, and she ends sly.
  function sceneBug() {
    const local = createScope();
    const show = WIPE + BEAT;
    const guide = guideRow(local, {
      lines: BUG_LINES,
      startAfter: show + SUSPICIOUS_MS,
      holds: [0, 500],
      pose: (page, when) => {
        const low = page === 1 && when === 'read';
        if (low) guide.sofi.sheepish(true);
        return low ? 'lowered' : 'talking';
      },
      onDone: () => {
        guide.sofi.sheepish(false);
        guide.sofi.setPose('sly');
        local.after(REVEAL_DELAY, revealKey);
      },
    });
    guide.sofi.setPose('suspicious');
    local.after(show, () => {
      guide.host.hidden = false; // the one-pass look starts as she is displayed
    });
    return {
      attach: () => slot('guide-slot').replaceWith(guide.host),
      dispose: () => {
        guide.sofi.dispose();
        local.dispose();
      },
    };
  }

  // 2 · The deleted letter is back in the tree. A look, a head tilt, a jolt: "Oh." Then eyes
  // down for the awkward lines; she straightens to move on, and ends sly.
  function sceneLetter() {
    const local = createScope();
    const show = WIPE + BEAT;
    const guide = guideRow(local, {
      lines: LETTER_LINES,
      startAfter: show + LETTER_BEATS.reduce((sum, [, ms]) => sum + ms, 0),
      holds: [900, 300, 500],
      pose: (page, when) => {
        if (when === 'read') {
          guide.sofi.sheepish(true);
          return 'lowered';
        }
        if (page === 3) guide.sofi.sheepish(false); // "Anyway": she straightens up
        return 'talking';
      },
      onDone: () => {
        guide.sofi.setPose('sly');
        local.after(REVEAL_DELAY, revealKey);
      },
    });
    let at = show;
    for (const [pose, ms] of LETTER_BEATS) {
      local.after(at, () => {
        guide.host.hidden = false;
        guide.sofi.setPose(pose);
      });
      at += ms;
    }
    return {
      attach: () => slot('guide-slot').replaceWith(guide.host),
      dispose: () => {
        guide.sofi.dispose();
        local.dispose();
      },
    };
  }

  // 3 · "add vampires" undone, and every style with it. She blames Luis with a smirk; he
  // shrugs in, unbothered; she deflates and concedes. The song keeps playing.
  function sceneTheme() {
    const local = createScope();
    const show = WIPE + BEAT;
    const luisHost = document.createElement('div');
    luisHost.className = 'c-luis';
    luisHost.hidden = true;
    const guide = guideRow(local, {
      lines: [THEME_SOFI],
      startAfter: show + 500,
      onDone: () => {
        guide.sofi.setPose('smirk');
        local.after(700, () => {
          luisHost.hidden = false;
          luisHost.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
        local.after(1200, () => luis.start());
      },
    });
    const luis = mountLuisCameo(luisHost, {
      scope: local,
      lines: [THEME_LUIS],
      onDone: () => {
        guide.sofi.setPose('lowered'); // "...I made you a song." lands
        guide.sofi.sheepish(true);
        local.after(500, () =>
          guide.sofi.say([THEME_SOFI_AFTER], {
            onDone: () =>
              local.after(900, () => {
                guide.sofi.sheepish(false);
                local.after(REVEAL_DELAY, revealKey);
              }),
          }),
        );
      },
    });
    local.after(show, () => {
      guide.host.hidden = false;
    });
    return {
      attach: () => {
        slot('guide-slot').replaceWith(guide.host);
        slot('luis-slot').replaceWith(luisHost);
      },
      dispose: () => {
        guide.sofi.dispose();
        luis.dispose();
        local.dispose();
      },
    };
  }

  const SCENES = { 1: sceneBug, 2: sceneLetter, 3: sceneTheme };

  function render() {
    const { depth } = state;
    if (depth >= ORIGIN) {
      app.theme('light');
      root.innerHTML = origin;
    } else if (depth === NAKED) {
      app.theme('naked');
      root.innerHTML = naked(depth);
    } else {
      app.theme('dark');
      root.innerHTML = gothic(depth);
    }
    scene?.attach();
  }

  function roll() {
    if (state.busy || state.depth >= ORIGIN) return;
    state.busy = true;
    if (scene) {
      scene.dispose();
      scene = null;
    }
    const next = state.depth + 1;
    scene = SCENES[next] ? SCENES[next]() : null; // inside the tap: the voices unlock here
    root.insertAdjacentHTML('beforeend', wipe);
    scope.after(WIPE, () => {
      state.depth = next;
      state.busy = false;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Opening the letter: the commit card fades out; the letter dawns on the same paper.
  function open() {
    if (state.busy) return;
    state.busy = true;
    root.querySelector('.origin')?.classList.add('is-leaving');
    scope.after(DUSK, () => app.go('letter'));
  }

  const off = onAction(root, { roll, open });

  render();
  preloadFrames();
  preloadLuis();
  preloadLuisCameo();
  preloadLetter();

  return () => {
    off();
    if (scene) scene.dispose();
    scope.dispose();
  };
}
