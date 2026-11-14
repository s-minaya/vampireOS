import cloudGif from '../assets/cloud-pixel-art.gif';
import { createScope } from '../util.js';

// DO_NOT_OPEN/identity.service: a short identity scan that confidently mistakes David for
// Cloud Strife, then lists five traits that fit him rather too well. It runs by itself,
// has no sound (the song plays on) and is cancelled by leaving the file.

// Approved wording: keep verbatim.
const TRAITS = [
  'Quiet, brooding, secretly emotional',
  'Big "I\'ll handle it alone" energy',
  'Loyal once you break through',
  'Struggles with identity but keeps fighting',
  'Accidentally cool without trying',
];

const typed = (text) => `<span class="ident-type" style="--n:${text.length}">${text}</span>`;

const body = `
  <div class="ident-log" role="status">
    <div>${typed('SCANNING USER PROFILE...')}<span class="ident-step" data-id="ok"> OK</span></div>
    <div class="ident-step" data-id="compare">${typed('COMPARING PERSONALITY SIGNATURES...')}<span class="ident-step c-red" data-id="err"> ERR</span></div>
  </div>
  <div class="ident-slot" data-id="slot" role="status">EXPECTED: DAVID</div>
  <div class="ident-frame">
    <i class="ident-corners" aria-hidden="true"></i>
    <i class="ident-beam" aria-hidden="true"></i>
    <span class="ident-unknown" aria-hidden="true">?</span>
    <img class="ident-gif" src="${cloudGif}" width="304" height="220" alt="Animated pixel-art sprite of Cloud Strife holding his Buster Sword" decoding="async">
  </div>
  <div class="ident-plate" role="status">
    <div class="ident-pending" data-id="pending">RESULT: PENDING</div>
    <div class="ident-name" data-id="name" hidden>CLOUD STRIFE</div>
    <div class="ident-conf" data-id="conf" hidden>match confidence: <span class="c-red">97%</span></div>
  </div>
  <div class="ident-traits" data-id="traits" hidden>
    <div class="console-label">PERSONALITY SIGNATURES</div>
    <ul>${TRAITS.map((trait, i) => `<li class="ident-step" data-id="trait${i}">${trait}</li>`).join('')}</ul>
  </div>
  <div class="ident-verdict" data-id="verdict" role="status" hidden>
    <div><span class="c-dim">IDENTITY:</span> <span class="c-red">INCORRECT</span></div>
    <div class="ident-step" data-id="accurate"><span class="c-dim">PERSONALITY MATCH:</span> <span>SUSPICIOUSLY ACCURATE</span></div>
  </div>
  <div class="win-status"><span data-id="status">scanning...</span><span>debug mode</span></div>
`;

// `win` is the explorer window, already holding its title bar.
export function mountIdentity(win) {
  const scope = createScope();
  win.insertAdjacentHTML('beforeend', body);
  const ref = (name) => win.querySelector(`[data-id="${name}"]`);
  const status = (text) => {
    ref('status').textContent = text;
  };

  // The window grows as results come in: keep its newest line above the music player,
  // unless David has started scrolling on his own.
  let follow = true;
  const unfollow = () => {
    follow = false;
  };
  window.addEventListener('touchmove', unfollow, { passive: true });
  window.addEventListener('wheel', unfollow, { passive: true });
  const keepInView = () => {
    if (follow) win.scrollIntoView({ block: 'end', behavior: 'smooth' });
  };

  const on = (name) => ref(name).classList.add('is-on'); // reveals a line whose room is reserved
  const open = (name) => {
    ref(name).hidden = false; // reveals a block: the window grows
    keepInView();
  };

  scope.after(750, () => on('ok'));
  scope.after(900, () => on('compare'));

  scope.after(2500, () => {
    on('err');
    const slot = ref('slot');
    slot.textContent = 'IDENTITY MISMATCH';
    slot.classList.add('is-alert');
    win.classList.add('shake');
    status('mismatch');
  });

  scope.after(3000, () => {
    win.classList.add('is-found');
    ref('pending').hidden = true;
    ref('name').hidden = false;
    ref('conf').hidden = false;
    status('match: 97%');
    keepInView();
  });

  scope.after(3900, () => open('traits'));
  TRAITS.forEach((_, i) => {
    scope.after(4150 + i * 420, () => {
      on(`trait${i}`);
      status(`signatures: ${i + 1}/${TRAITS.length}`);
    });
  });

  scope.after(6400, () => open('verdict'));
  scope.after(7000, () => {
    on('accurate');
    status('suspicious');
  });

  return {
    dispose() {
      window.removeEventListener('touchmove', unfollow);
      window.removeEventListener('wheel', unfollow);
      scope.dispose();
    },
  };
}
