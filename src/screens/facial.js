import car from '../assets/faces/face-car.jpeg';
import shades from '../assets/faces/face-shades.jpeg';
import upsideDown from '../assets/faces/face-upside-down.jpeg';
import dark from '../assets/faces/face-dark.jpeg';
import close from '../assets/faces/face-close.jpeg';
import pout from '../assets/faces/face-pout.jpeg';
import teeth from '../assets/faces/face-teeth.jpeg';
import mirror from '../assets/faces/face-mirror.jpeg';
import nostrils from '../assets/faces/face-nostrils.jpeg';
import { createScope } from '../util.js';

// DO_NOT_OPEN/facial_recognition.log: a fake biometric dossier built on David's nine
// ridiculous photos (unmodified copies of fotos-ridiculas/, all 900x1600). The records are
// "decrypted", a short skippable montage overwhelms the recogniser, and then David reviews
// the exhibits by hand: PREV/NEXT, swipe, a counter and, after the ninth, the verdict.
// Nothing is analysed: every diagnostic below is written by hand. No sound; the song plays on.

// Tracking boxes are [left, top, width, height, label, 'below'?] in % of the photo.
// The notes are set in IM Fell, whose old-style figures read badly: keep digits in the titles.
const EXHIBITS = [
  {
    src: car,
    alt: 'David in a car at night, wearing a cap and giving a deadpan thumbs up',
    title: 'THUMB: APPROVES. FACE: ABSTAINS.',
    note: 'The subject signals delight. Nothing above the wrist corroborates it.',
    boxes: [[22, 27, 42, 35, 'JOY: 0%'], [68, 45, 25, 27, 'JOY: 100%']],
  },
  {
    src: shades,
    alt: "Extreme close-up of David's sunglasses and one eyebrow",
    title: 'EYES: WITHHELD BY SUBJECT',
    note: 'One eyebrow recovered. The rest of the face declined to comment.',
    boxes: [[36, 36, 58, 9, 'EYEBROW (1)'], [4, 49, 87, 45, 'ACCESS DENIED']],
  },
  {
    src: upsideDown,
    alt: 'David lying down, photographed upside down with his eyes shut and a hand on his forehead',
    title: 'ERROR: FACE INSTALLED UPSIDE DOWN',
    note: 'Kindly turn the subject over and try again. The subject has refused.',
    boxes: [[11, 31, 35, 12, 'CHIN (TOP)'], [1, 72, 34, 26, 'HAND: WHY']],
  },
  {
    src: dark,
    alt: "Very dark low-angle close-up of David's face",
    title: 'SUBJECT IS 94% DARKNESS',
    note: 'Lighting: none. A vampire operating system is obliged to approve.',
    boxes: [[10, 12, 80, 60, 'FACE? (GUESS)']],
  },
  {
    src: close,
    alt: "Blurry extreme close-up of David's eyes, nose and mouth",
    title: 'SUBJECT TOO CLOSE TO SENSOR',
    note: 'Personal space: violated. The camera has requested a moment alone.',
    boxes: [[3, 2, 94, 96, 'FACE EXCEEDS FRAME']],
  },
  {
    src: pout,
    alt: 'Low-angle close-up of David pouting at the camera',
    title: 'POUT INTENSITY: CRITICAL',
    note: 'Photographed from the floor. Motive unknown. Outcome: this.',
    boxes: [[70, 26, 28, 11, 'JUDGING YOU'], [9, 46, 86, 20, 'LIP SURPLUS']],
  },
  {
    src: teeth,
    alt: 'Low-angle close-up of David with wide eyes and bared teeth',
    title: 'EXPRESSION NOT IN DATABASE',
    note: 'Closest known match: “deploying to production on a Friday”.',
    boxes: [[9, 26, 82, 13, 'PANIC: 2 OF 2'], [20, 55, 60, 15, 'TEETH: ALARMED']],
  },
  {
    src: mirror,
    alt: 'David taking a mirror selfie with a satisfied smirk',
    title: 'ANOMALY: A FLATTERING PHOTOGRAPH',
    note: 'Statistically improbable. The subject is visibly aware of it.',
    boxes: [[20, 19, 27, 21, 'SMIRK: 98%'], [48, 30, 20, 21, 'ACCOMPLICE', 'below']],
  },
  {
    src: nostrils,
    alt: "Extreme close-up of David's nostrils and moustache, seen from below",
    title: 'NOSE LOCATED. BARBARIDAD DETECTED.',
    note: 'Captured from directly below. Nothing above the nose made it into the frame.',
    boxes: [[6, 16, 32, 22, 'NOSTRIL'], [57, 17, 34, 23, 'ALSO NOSTRIL']],
  },
];
const TOTAL = EXHIBITS.length;

const VERDICT_TITLE =
  '<div><span class="c-dim">IDENTITY:</span> <span class="c-bone">CONFIRMED</span></div><div><span class="c-dim">DIGNITY:</span> 404 NOT FOUND</div>';
const VERDICT_NOTE = 'It is unmistakably David. Condolences have been issued.';

// The montage: one line per flash, as the recogniser loses its composure.
const MONTAGE = [
  ['FACES FOUND: 1', 'FACE'],
  ['FACES FOUND: 2', 'FACE?'],
  ['FACES FOUND: 5', 'ALSO FACE?'],
  ['FACES FOUND: 9', 'FACE??'],
  ['FACES FOUND: 31', 'NOSE?'],
  ['FACES FOUND: 204', 'NOT A FACE'],
  ['IS THAT A FACE?', 'CHIN?'],
  ['NOSTRIL OR EYE?', 'EYE?'],
  ['TOO MANY ANGLES', 'WHO'],
  ['RECALIBRATING...', 'FACE?'],
  ['WHY IS IT SO CLOSE', 'TOO CLOSE'],
  ['RECALIBRATING HARDER...', 'WHY'],
  ['FACES FOUND: 9,999', 'FACE???'],
  ['WHO TOOK THESE', 'EVIDENCE'],
  ['PLEASE SLOW DOWN', 'HELP'],
  ['FACE BUFFER OVERFLOW', 'NO'],
  ['PLEASE STOP', 'STOP'],
  ['PLEASE', 'PLEASE'],
];
const flashDelay = (i) => Math.max(95, 210 - i * 14); // ms: speeds up, never a strobe

const chevron = (d) => `<svg class="chev" aria-hidden="true" viewBox="0 0 10 18" width="10" height="18"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const two = (n) => String(n).padStart(2, '0');

const boxHtml = ([x, y, w, h, label, place]) => {
  const side = x + w / 2 > 55 ? ' fr-tag--r' : '';
  const where = place === 'below' ? ' fr-tag--below' : y < 9 ? ' fr-tag--in' : ''; // default: above the box
  return `<i class="fr-box" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"><b class="fr-tag${side}${where}">${label}</b></i>`;
};

const body = `
  <div class="fr-main">
    <div class="fr-side" aria-hidden="true"><span class="fr-rec">REC<i></i></span><i class="fr-ruler"></i></div>
    <div class="fr-stage" data-fr="stage">
      <img class="fr-photo" data-fr="photo" alt="" decoding="sync" draggable="false" hidden>
      <div class="fr-boxes" data-fr="boxes" aria-hidden="true"></div>
      <div class="fr-sheet" data-fr="sheet" hidden></div>
      <div class="fr-seal" data-fr="seal" aria-hidden="true">
        <span class="fr-stamp">CLASSIFIED</span>
        <span class="fr-seal-sub">${TOTAL} RECORDS SEALED</span>
        <span class="fr-bar"><i data-fr="fill"></i></span>
      </div>
      <i class="fr-corners" aria-hidden="true"></i>
      <i class="fr-beam" data-fr="beam" aria-hidden="true"></i>
    </div>
    <div class="fr-side">
      <span aria-hidden="true">ISO 666</span><i class="fr-ruler" aria-hidden="true"></i>
      <button class="fr-hud" data-fr="hud" data-go="hud" aria-pressed="true" aria-label="Tracking overlay" hidden>HUD</button>
    </div>
  </div>
  <div class="fr-caption" data-fr="caption">
    <div class="fr-title" data-fr="title">OPENING CLASSIFIED RECORDS...</div>
    <p class="fr-note voice" data-fr="note">Nine photographs of the subject were recovered. Viewer discretion is advised.</p>
  </div>
  <div class="fr-foot" data-fr="intro">
    <span class="fr-progress" data-fr="progress" role="status">decrypting 0/${TOTAL}</span>
    <button class="fr-skip" data-go="skip">SKIP ${chevron('M2 2 L8 9 L2 16')}</button>
  </div>
  <div class="fr-foot" data-fr="nav" hidden>
    <button class="fr-nav" data-fr="prev" data-go="prev" aria-label="Previous exhibit">${chevron('M8 2 L2 9 L8 16')}<span>PREV</span></button>
    <span class="fr-count" data-fr="count"></span>
    <button class="fr-nav" data-fr="next" data-go="next"><span data-fr="next-label">NEXT</span>${chevron('M2 2 L8 9 L2 16')}</button>
  </div>
`;

// Fetch and decode the photos ahead of the montage. Called when the folder opens.
let faces = null;
export function preloadFaces() {
  if (!faces) {
    faces = EXHIBITS.map(({ src }) => {
      const img = new Image();
      img.src = src;
      return { img, ready: img.decode().catch(() => {}) };
    });
  }
  return faces;
}

// `win` is the explorer window, already holding its title bar.
export function mountFacial(win) {
  const scope = createScope();
  win.insertAdjacentHTML('beforeend', body);
  const ref = (name) => win.querySelector(`[data-fr="${name}"]`);
  const el = Object.fromEntries(
    ['stage', 'photo', 'boxes', 'sheet', 'seal', 'fill', 'beam', 'hud', 'caption', 'title', 'note', 'intro', 'progress', 'nav', 'prev', 'next', 'next-label', 'count'].map((name) => [name, ref(name)]),
  );

  let phase = 'load'; // load → scan → dossier
  let index = 0; // 0-8: exhibits, 9: the verdict
  let hud = true;

  // The window is taller than the room above the music player on a short phone:
  // settle it there once (debug.js has just scrolled the new view to the top).
  // Not on `scope`: skipping the intro at once must not cancel it.
  const settleTimer = setTimeout(() => win.scrollIntoView({ block: 'end', behavior: 'smooth' }), 360);

  // ── Records: the bar follows the real decoding, paced so that it can be read ──
  let ready = 0;
  let counted = 0;
  preloadFaces().forEach((face) => face.ready.then(() => (ready += 1)));
  const pace = scope.every(130, () => {
    if (counted < ready) {
      counted += 1;
      el.fill.style.width = `${(counted / TOTAL) * 100}%`;
      el.progress.textContent = `decrypting ${counted}/${TOTAL}`;
    }
    if (counted === TOTAL) startScan();
  });
  scope.after(6000, startScan); // a slow connection: begin anyway, the photos arrive as they load

  function startScan() {
    if (phase !== 'load') return;
    phase = 'scan';
    scope.stop(pace);
    el.seal.classList.add('is-off');
    win.classList.add('is-scanning');
    el.title.textContent = 'RUNNING FACIAL RECOGNITION...';
    el.note.textContent = 'Stand by. This will only take a moment.';
    el.progress.textContent = 'faces found: 0';
    scope.after(650, () => {
      el.seal.hidden = true;
      el.photo.hidden = false;
      flash(montageOrder(), 0);
    });
  }

  // ── Montage: every photo twice, never the same one back to back ──
  function montageOrder() {
    const shuffled = () => {
      const deck = EXHIBITS.map((_, i) => i);
      for (let i = deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      return deck;
    };
    const first = shuffled();
    const second = shuffled();
    if (second[0] === first[first.length - 1]) second.push(second.shift());
    return [...first, ...second];
  }

  const between = (min, max) => min + Math.random() * (max - min);

  function flash(order, i) {
    if (i === MONTAGE.length) {
      overwhelmed();
      return;
    }
    const [line, tag] = MONTAGE[i];
    el.photo.src = EXHIBITS[order[i]].src;
    el.photo.style.transform = `translate(${between(-6, 6)}%, ${between(-5, 5)}%) scale(${between(1.04, 1.3)}) rotate(${between(-4, 4)}deg)`;
    const w = between(26, 52);
    const h = between(14, 34);
    el.boxes.innerHTML = boxHtml([between(2, 96 - w), between(10, 96 - h), w, h, tag]);
    el.title.textContent = line.startsWith('FACES') ? 'RUNNING FACIAL RECOGNITION...' : line;
    if (line.startsWith('FACES')) el.progress.textContent = line.toLowerCase();
    scope.after(flashDelay(i), () => flash(order, i + 1));
  }

  function overwhelmed() {
    win.classList.remove('is-scanning');
    win.classList.add('shake');
    el.boxes.innerHTML = '';
    el.title.textContent = 'SYSTEM OVERWHELMED';
    el.title.classList.add('is-alert');
    el.note.textContent = 'Automatic analysis has failed. Proceeding to manual review.';
    el.progress.textContent = 'faces found: too many';
    scope.after(1300, startDossier);
  }

  // ── Dossier ──
  function startDossier() {
    if (phase === 'dossier') return;
    phase = 'dossier';
    scope.dispose(); // whatever was left of the intro
    win.classList.remove('is-scanning');
    el.seal.hidden = true;
    el.title.classList.remove('is-alert');
    el.photo.style.transform = '';
    el.intro.hidden = true;
    el.nav.hidden = false;
    el.caption.setAttribute('aria-live', 'polite');
    show(0, 1);
  }

  function buildSheet() {
    el.sheet.innerHTML = EXHIBITS.map(
      ({ src }, i) => `<button class="fr-thumb" data-go="jump" data-index="${i}" style="--i:${i}" aria-label="Exhibit ${i + 1} of ${TOTAL}"><img src="${src}" alt="" draggable="false"><b>${two(i + 1)}</b></button>`,
    ).join('');
  }

  // dir: +1 arriving from the right, -1 from the left, 0 without the slide
  function show(next, dir) {
    index = next;
    const verdict = index === TOTAL;
    if (verdict && !el.sheet.firstChild) buildSheet();
    el.sheet.hidden = !verdict;
    el.photo.hidden = verdict;
    el.hud.hidden = verdict;
    el.title.classList.toggle('fr-title--verdict', verdict);
    if (verdict) {
      el.boxes.innerHTML = '';
      el.title.innerHTML = VERDICT_TITLE;
      el.note.textContent = VERDICT_NOTE;
    } else {
      const exhibit = EXHIBITS[index];
      el.photo.src = exhibit.src;
      el.photo.alt = exhibit.alt;
      el.boxes.innerHTML = exhibit.boxes.map(boxHtml).join('');
      el.title.textContent = exhibit.title;
      el.note.textContent = exhibit.note;
    }
    el.count.textContent = verdict ? 'VERDICT' : `${two(index + 1)} / ${two(TOTAL)}`;
    el.count.setAttribute('aria-label', verdict ? 'Verdict' : `Exhibit ${index + 1} of ${TOTAL}`);
    el.prev.disabled = index === 0;
    el.next.disabled = verdict;
    el['next-label'].textContent = index === TOTAL - 1 ? 'VERDICT' : 'NEXT';
    el.next.setAttribute('aria-label', index === TOTAL - 1 ? 'Verdict' : 'Next exhibit');

    // One quick slide and a single pass of the beam: nothing to wait for.
    if (!dir || !el.photo.animate) return;
    (verdict ? el.sheet : el.photo).animate([{ transform: `translateX(${dir * 26}px)`, opacity: 0.2 }, { transform: 'none', opacity: 1 }], { duration: 160, easing: 'steps(4, end)' });
    if (!verdict) el.beam.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(349px)', opacity: 1 }], { duration: 300, easing: 'steps(10, end)' });
  }

  function step(by) {
    const next = index + by;
    if (phase !== 'dossier' || next < 0 || next > TOTAL) return;
    show(next, by);
  }

  const actions = {
    skip: startDossier,
    prev: () => step(-1),
    next: () => step(1),
    jump: (button) => show(Number(button.dataset.index), -1),
    hud: () => {
      hud = !hud;
      el.stage.classList.toggle('is-clean', !hud);
      el.hud.setAttribute('aria-pressed', String(hud));
    },
  };
  const onClick = (event) => {
    const button = event.target.closest('[data-go]');
    if (button) actions[button.dataset.go](button);
    else if (phase !== 'dossier' && event.target.closest('.fr-stage')) startDossier(); // tapping the montage skips it too
  };
  win.addEventListener('click', onClick);

  // ── Swipe: the photo follows the finger sideways; vertical drags still scroll the page ──
  let drag = null;
  const settle = () => {
    drag = null;
    if (phase === 'dossier') el.photo.style.transform = '';
  };
  const onTouchStart = (event) => {
    drag = phase === 'dossier' && event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY, dx: 0, axis: null } : null;
  };
  const onTouchMove = (event) => {
    if (!drag) return;
    drag.dx = event.touches[0].clientX - drag.x;
    const dy = event.touches[0].clientY - drag.y;
    if (!drag.axis && Math.abs(drag.dx) + Math.abs(dy) > 10) drag.axis = Math.abs(drag.dx) > Math.abs(dy) ? 'x' : 'y';
    if (drag.axis === 'x') el.photo.style.transform = `translateX(${drag.dx * 0.5}px)`;
  };
  const onTouchEnd = () => {
    const swipe = drag && drag.axis === 'x' && Math.abs(drag.dx) > 44 ? -Math.sign(drag.dx) : 0;
    settle();
    if (swipe) step(swipe);
  };
  el.stage.addEventListener('touchstart', onTouchStart, { passive: true });
  el.stage.addEventListener('touchmove', onTouchMove, { passive: true });
  el.stage.addEventListener('touchend', onTouchEnd);
  el.stage.addEventListener('touchcancel', settle);

  // The stage and its touch listeners go with the view's markup.
  return {
    dispose() {
      clearTimeout(settleTimer);
      scope.dispose();
      win.removeEventListener('click', onClick);
    },
  };
}
