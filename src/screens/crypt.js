import { createScope, onAction, escapeHtml } from '../util.js';

// Beat 4: The Commit Crypt. Each ROLL BACK undoes the newest commit, and the
// gothic interface falls away until only the original commit is left.

const COMMITS = [
  { hash: '7a1e0f1', who: 'David', msg: 'fix: false → true', aside: '' },
  { hash: 'c0ffee5', who: 'Sofi', msg: 'fix (real this time)', aside: '' },
  { hash: 'dead1e7', who: 'Sofi', msg: 'delete birthday_letter.txt', aside: 'too sincere. nobody needs to see that.' },
  { hash: 'bad5eed', who: 'Sofi', msg: 'touch the backend (how hard can it be)', aside: '' },
  { hash: 'b100d15', who: 'Sofi', msg: 'add vampires', aside: 'everything is better with vampires.' },
  { hash: '05c0ded', who: 'Sofi', msg: 'what if this was an entire operating system', aside: '' },
  { hash: '0000001', who: 'Sofi', msg: '', aside: '' },
];

// What the system reports after each rollback (index = commits undone).
const STATUSES = [
  '',
  '> Reverted "fix: false → true". The defect has returned.',
  '> Reverted "fix (real this time)". No functional change detected.',
  '> Restored: gift/birthday_letter.txt',
  '> Reverted "touch the backend". BARBARIDAD_EXCEPTION no longer reproducible.',
  'Reverted "add vampires".',
];

const ORIGIN = COMMITS.length - 1;
const NAKED = ORIGIN - 1;

const treeText = (depth) => (depth >= 3 ? 'gift/ · 1 item · birthday_letter.txt' : 'gift/ · 0 items');

function gothic(depth) {
  const top = COMMITS[depth];
  const broken = depth >= 1 && depth <= 3;
  const sealed = COMMITS.slice(depth + 1)
    .map((c) => `<div class="sealed"><i aria-hidden="true"></i><span>${c.hash}</span><b aria-hidden="true"></b><span>${c.who}</span></div>`)
    .join('');
  return `
    <div class="glow glow--low" aria-hidden="true"></div>
    ${broken ? '<div class="strip strip--fatal enter"><span>FATAL: BARBARIDAD_EXCEPTION</span><span class="cursor" aria-hidden="true"></span></div>' : ''}
    <div class="c-content">
      <header class="git-head">
        <div class="voice c-dim git-presents">VampireOS proudly presents</div>
        <h1 class="git-title ${broken ? 'glitch glitch--wide' : ''}">Git</h1>
        <div class="git-ribbon">PREMIUM BIRTHDAY FEATURE</div>
      </header>
      ${depth === 0 ? `
      <div class="sofi-note">
        <div>Don't panic, David. I know you're not used to seeing this at work.</div>
        <div>For your birthday, I've included Git. You're welcome. — Sofi</div>
      </div>` : `
      <div class="git-status ${depth === 3 ? 'c-pink' : ''}" role="status">${escapeHtml(STATUSES[depth])}</div>`}
      <div class="win commit">
        <div class="commit-meta"><span>HEAD · ${top.hash}</span><span class="${top.who === 'Sofi' ? 'c-pink' : 'c-bone'}">${top.who}</span></div>
        <div class="commit-msg">${escapeHtml(top.msg)}</div>
        ${top.aside ? `<div class="commit-aside">${escapeHtml(top.aside)}</div>` : ''}
        <button class="key key--primary commit-roll" data-act="roll">ROLL BACK</button>
      </div>
      <div class="sealed-list">${sealed}</div>
      <div class="tree"><span>working tree</span><span class="${depth >= 3 ? 'c-pink' : ''}">${treeText(depth)}</span></div>
    </div>
  `;
}

function naked(depth) {
  const top = COMMITS[depth];
  const older = COMMITS.slice(depth + 1).map((c) => `<li>${c.hash} — ${c.who}</li>`).join('');
  return `
    <div class="naked">
      <p>VampireOS proudly presents</p>
      <h1>Git</h1>
      <p>PREMIUM BIRTHDAY FEATURE</p>
      <hr />
      <p role="status">${escapeHtml(STATUSES[depth])}</p>
      <p class="naked-head"><b>HEAD</b> ${top.hash} — ${top.who}</p>
      <p class="naked-msg">${escapeHtml(top.msg)}</p>
      <button class="naked-btn" data-act="roll">ROLL BACK</button>
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

export function mountCrypt(root, app) {
  const scope = createScope();
  const state = { depth: 0, busy: false };

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
  }

  function roll() {
    if (state.busy || state.depth >= ORIGIN) return;
    state.busy = true;
    root.insertAdjacentHTML('beforeend', wipe);
    scope.after(520, () => {
      state.depth += 1;
      state.busy = false;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const off = onAction(root, {
    roll,
    open: () => app.go('letter'),
  });

  render();

  return () => {
    off();
    scope.dispose();
  };
}
