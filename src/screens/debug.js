import { createScope, onAction, escapeHtml } from '../util.js';
import { ORIGINAL_SOURCE, runChecks } from '../puzzle.js';

// Beat 3: debug mode, the fake filesystem, the typed code puzzle and the
// empty gift folder that leads to the commit history.

const icons = {
  file: (stroke) => `<svg class="ico" aria-hidden="true" viewBox="0 0 22 26" width="22" height="26"><path d="M2 1 H14 L20 7 V25 H2 Z" fill="none" stroke="${stroke}" stroke-width="2"/><path d="M14 1 V7 H20" fill="none" stroke="${stroke}" stroke-width="2"/></svg>`,
  folder: `<svg class="ico" aria-hidden="true" viewBox="0 0 22 26" width="22" height="26"><path d="M1 5 H9 L11 8 H21 V23 H1 Z" fill="none" stroke="#8f8175" stroke-width="2"/></svg>`,
  lock: `<svg class="ico" role="img" aria-label="Locked" viewBox="0 0 22 26" width="22" height="26"><rect x="3" y="11" width="16" height="13" fill="none" stroke="#8f8175" stroke-width="2"/><path d="M7 11 V7 A4 4 0 0 1 15 7 V11" fill="none" stroke="#8f8175" stroke-width="2"/></svg>`,
  next: `<svg class="chev" aria-hidden="true" viewBox="0 0 10 18" width="10" height="18"><path d="M2 2 L8 9 L2 16" fill="none" stroke="#eadfcf" stroke-width="2"/></svg>`,
  back: `<svg class="chev" aria-hidden="true" viewBox="0 0 10 18" width="10" height="18"><path d="M8 2 L2 9 L8 16" fill="none" stroke="#eadfcf" stroke-width="2"/></svg>`,
};

const strip = (patched) =>
  patched
    ? '<div class="strip strip--ok">BARBARIDAD RESOLVED</div>'
    : '<div class="strip strip--fatal"><span>FATAL: BARBARIDAD_EXCEPTION</span><span class="cursor" aria-hidden="true"></span></div>';

const winBar = (title) => `<div class="win-bar"><div class="win-chip">${title}</div></div>`;

const backButton = `<button class="back" data-act="files">${icons.back}<span>/vampireos</span></button>`;

const filesView = `
  <div class="d-stack">
    <div>
      <h1 class="d-title d-title--ghost">Debug Mode</h1>
      <p class="voice c-dim d-warning">Please do not inspect the source code. Everything is perfectly fine.</p>
    </div>
    <div class="win">
      ${winBar('/vampireos')}
      <div class="row row--dim">
        ${icons.file('#8f8175')}
        <div class="row-text"><div class="row-name">frontend/absolutely_perfect.ts</div><div class="row-meta">0 bugs (self-reported)</div></div>
      </div>
      <div class="row row--dim">
        ${icons.file('#8f8175')}
        <div class="row-text"><div class="row-name">backend/what_is_rap.txt</div><div class="row-meta">0 bytes</div></div>
      </div>
      <button class="row row--open" data-act="code">
        ${icons.file('#eadfcf')}
        <span class="row-text"><span class="row-name">backend/please_work.js</span><span class="row-meta c-red">1 error</span></span>
        ${icons.next}
      </button>
      <button class="row row--open" data-act="arch">
        ${icons.file('#eadfcf')}
        <span class="row-text"><span class="row-name">ARCHITECTURE.txt</span><span class="row-meta c-dim">read-only</span></span>
        ${icons.next}
      </button>
      <div class="row row--dim row--last">
        ${icons.folder}
        <div class="row-text"><div class="row-name">gift/</div><div class="row-meta c-red">locked: BARBARIDAD_EXCEPTION</div></div>
        ${icons.lock}
      </div>
      <div class="win-status"><span>5 items</span><span>debug mode</span></div>
    </div>
    <div class="console">
      <div class="console-label">CONSOLE</div>
      <div class="console-lines">
        <div>GET /david/emotions → <span class="c-red">403 Forbidden</span></div>
        <div>GET /david/drama → 200 OK</div>
        <div>DELETE /david/emo-phase → <span class="c-red">405 Method Not Allowed</span></div>
      </div>
    </div>
  </div>
`;

const archView = `
  <div class="d-stack d-stack--tight enter">
    ${backButton}
    <div class="win">
      ${winBar('ARCHITECTURE.txt')}
      <div class="arch-report">
        <div class="arch-report-title">SYSTEM ARCHITECTURE</div>
        <div><span class="c-dim">Frontend:</span> React</div>
        <div><span class="c-dim">Backend:</span> Yes</div>
        <div><span class="c-dim">Database:</span> Probably</div>
        <div><span class="c-dim">Security:</span> Don't worry about it</div>
        <div><span class="c-dim">SAP compatibility:</span> Looks fine to me</div>
      </div>
    </div>
  </div>
`;

const gutter = (from, count) => Array.from({ length: count }, (_, i) => `<div>${from + i}</div>`).join('');

const idleOutput = '<div class="voice c-dim out-hint">You may edit the function. Kindly do not make it worse.</div>';

const codeView = (outputHtml) => `
  <div class="d-stack d-stack--tight enter">
    ${backButton}
    <div class="win">
      ${winBar('backend/please_work.js')}
      <div class="code code--readonly">
        <div class="code-line"><span class="code-no">1</span><span class="c-pink">// TODO: Figure out what ABAP is.</span></div>
        <div class="code-line"><span class="code-no">2</span><span>&nbsp;</span></div>
        <div class="code-line"><span class="code-no">3</span><span class="c-pink">// David does backend stuff.</span></div>
        <div class="code-line"><span class="code-no">4</span><span class="c-pink">// I do pretty buttons.</span></div>
        <div class="code-line"><span class="code-no">5</span><span class="c-pink">// This should be fine.</span></div>
        <div class="code-line"><span class="code-no">6</span><span>&nbsp;</span></div>
      </div>
      <div class="editor" data-ref="editor">
        <div class="editor-band">
          <div class="editor-gutter" aria-hidden="true">${gutter(7, 7)}</div>
          <textarea class="editor-input" data-ref="input" rows="7" wrap="off" spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off" aria-label="Source of canOpenGift. Editable."></textarea>
        </div>
        <div class="editor-actions">
          <button class="key key--primary editor-run" data-act="run">RUN</button>
          <button class="key editor-reset" data-act="reset">RESET</button>
        </div>
      </div>
      <div class="console console--output" role="status">
        <div class="console-label">OUTPUT</div>
        <div data-ref="output">${outputHtml}</div>
      </div>
      <div class="file-log">
        <div>Last modified by <span class="c-pink">Sofi</span>.</div>
        <div>Tested in production.</div>
        <div>Regrets: none.</div>
      </div>
    </div>
  </div>
`;

const fixedView = `
  <div class="fixed">
    <div class="stamp">BUG FIXED</div>
    <div class="stats enter">
      <div><span class="c-dim">Difficulty:</span> Trivial</div>
      <div><span class="c-dim">Time wasted:</span> Unnecessary</div>
      <div><span class="c-dim">Developer responsible:</span> <span class="c-pink">Sofi</span></div>
      <div><span class="c-dim">Developer confidence:</span> Unreasonably high</div>
    </div>
    <div class="rule" aria-hidden="true"><span></span><i></i><span></span></div>
    <div class="voice fixed-speech enter">
      <p>Congratulations.</p>
      <p>You have successfully fixed a bug that should never have existed.</p>
      <p><span class="c-pink">Sofi</span> has been notified and has chosen to ignore this incident.</p>
    </div>
    <button class="key key--primary key--md" data-act="gift">OPEN GIFT</button>
  </div>
`;

// The empty folder must not explain itself (VAMPIREOS.md, beat 4).
const giftView = `
  <div class="d-stack enter">
    <h1 class="d-title">Your Gift</h1>
    <div class="win">
      ${winBar('/vampireos/gift')}
      <div class="void">
        <svg class="cobweb" aria-hidden="true" viewBox="0 0 120 120" width="120" height="120">
          <path d="M120 0 L10 0 M120 0 L18.4 42.1 M120 0 L42.2 77.8 M120 0 L77.9 101.6 M120 0 L120 110" fill="none" stroke="#8f8175" stroke-width="1"/>
          <path d="M90 0 L92.3 11.5 L98.8 21.2 L108.5 27.7 L120 30" fill="none" stroke="#8f8175" stroke-width="1"/>
          <path d="M65 0 L69.2 21 L81.1 38.9 L99 50.8 L120 55" fill="none" stroke="#8f8175" stroke-width="1"/>
          <path d="M40 0 L46.1 30.6 L63.4 56.6 L89.4 73.9 L120 80" fill="none" stroke="#8f8175" stroke-width="1"/>
          <path d="M15 0 L23 40.2 L45.8 74.2 L79.8 97 L120 105" fill="none" stroke="#8f8175" stroke-width="1"/>
        </svg>
        <span class="cursor void-cursor" aria-hidden="true"></span>
      </div>
      <div class="win-status win-status--bright"><span>0 items</span><span>0 bytes</span></div>
    </div>
    <button class="key key--md" data-act="history">VERSION HISTORY</button>
  </div>
`;

function describeRun(result) {
  const lines = ['<div class="c-dim">$ run backend/please_work.js</div>'];
  if (result.error) {
    lines.push(`<div class="c-red">${escapeHtml(result.error)}</div>`);
    return { passed: false, lines, verdict: 'It no longer runs at all. RESET restores the original, such as it was.' };
  }
  let failed = 0;
  result.results.forEach((r) => {
    const call = escapeHtml(`canOpenGift('${r.arg}') → ${r.shown}`);
    if (r.ok) {
      lines.push(`<div>PASS  ${call}</div>`);
      return;
    }
    failed += 1;
    lines.push(`<div class="c-red">FAIL  ${call}</div>`);
    lines.push(`<div class="c-dim">      expected: ${r.want}</div>`);
  });
  if (failed === 0) {
    lines.push('<div>2 of 2 checks passed.</div>');
    return { passed: true, lines, verdict: 'Backend fixed by an actual backend developer. Unexpected but appreciated.' };
  }
  lines.push(`<div class="c-red">${failed} of 2 checks failed.</div>`);
  const [first, second] = result.results;
  let verdict = 'One check failed. The gift remains locked.';
  if (!first.ok && second.ok) verdict = 'The gift now opens every day of the year. Generous, but incorrect.';
  if (!first.ok && !second.ok) verdict = 'Remarkable. It is now wrong in both directions.';
  return { passed: false, lines, verdict };
}

const outputHtml = (run) => `<div class="out-lines">${run.lines.join('')}</div><div class="voice out-verdict">${run.verdict}</div>`;

export function mountDebug(root, app) {
  const scope = createScope();
  const state = { view: 'files', patched: false, code: ORIGINAL_SOURCE, output: idleOutput, locked: false };
  const ref = (name) => root.querySelector(`[data-ref="${name}"]`);

  function render() {
    const views = {
      files: filesView,
      arch: archView,
      code: codeView(state.output),
      fixed: fixedView,
      gift: giftView,
    };
    root.innerHTML = `${strip(state.patched)}<div class="d-content">${views[state.view]}</div>`;
    if (state.view === 'code') ref('input').value = state.code;
  }

  function show(view) {
    state.view = view;
    render();
    window.scrollTo(0, 0);
  }

  function run() {
    if (state.locked) return;
    const input = ref('input');
    input.blur(); // closes the keyboard so the output is visible
    state.code = input.value;
    const outcome = describeRun(runChecks(state.code));
    state.output = outputHtml(outcome);
    ref('output').innerHTML = state.output;
    ref('output').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (!outcome.passed) return;
    state.locked = true;
    state.patched = true;
    input.readOnly = true;
    root.querySelector('.strip').outerHTML = strip(true);
    scope.after(2800, () => show('fixed'));
  }

  function reset() {
    if (state.locked) return;
    state.code = ORIGINAL_SOURCE;
    state.output = idleOutput;
    ref('input').value = state.code;
    ref('output').innerHTML = state.output;
  }

  const off = onAction(root, {
    files: () => show('files'),
    arch: () => show('arch'),
    code: () => show('code'),
    gift: () => show('gift'),
    history: () => app.go('crypt'),
    run,
    reset,
  });

  const onInput = (event) => {
    if (event.target.matches('.editor-input')) state.code = event.target.value;
  };
  // Keep the function and RUN above the on-screen keyboard: leave room below
  // the page while typing, then bring the editor to the top of the screen.
  const onFocus = (event) => {
    if (!event.target.matches('.editor-input')) return;
    root.classList.add('is-typing');
    scope.after(320, () => {
      const editor = ref('editor');
      if (editor && document.activeElement === event.target) editor.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  };
  // Wait before giving the room back: collapsing it at once would move RUN
  // out from under the finger that is tapping it.
  const onBlur = (event) => {
    if (!event.target.matches('.editor-input')) return;
    scope.after(400, () => {
      if (document.activeElement !== event.target) root.classList.remove('is-typing');
    });
  };
  root.addEventListener('input', onInput);
  root.addEventListener('focusin', onFocus);
  root.addEventListener('focusout', onBlur);

  render();

  return () => {
    off();
    root.removeEventListener('input', onInput);
    root.removeEventListener('focusin', onFocus);
    root.removeEventListener('focusout', onBlur);
    root.classList.remove('is-typing');
    scope.dispose();
  };
}
