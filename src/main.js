import '@fontsource/jacquard-24/400.css';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import '@fontsource/im-fell-english-sc/400.css';
import '@fontsource/vt323/400.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/400-italic.css';
import './styles.css';

import sofiBlink from './assets/sofi-blink.webp';
import stillHere from './assets/are-u-still-here.webp';
import stillHereFx from './assets/are-u-still-here-fx.webp';
import talking from './assets/talking.webp';
import talkingMouth from './assets/talking-mouth.webp';
import iSeeYou from './assets/i-see-you.webp';

import { mountUpdate } from './screens/update.js';
import { mountDebug } from './screens/debug.js';
import { mountCrypt } from './screens/crypt.js';
import { mountLetter } from './screens/letter.js';
import { music } from './music.js';

const SCREENS = {
  update: { mount: mountUpdate, theme: 'dark' },
  debug: { mount: mountDebug, theme: 'dark' },
  crypt: { mount: mountCrypt, theme: 'dark' },
  letter: { mount: mountLetter, theme: 'light' },
};
const THEME_COLORS = { dark: '#0a0506', naked: '#c9c6c3', light: '#fbf9f7' };
const STORAGE_KEY = 'vampireos:screen';
const INTRO_KEY = 'vampireos:debug-intro'; // Sofi's Debug Mode introduction has been heard to the end
const GIFT_KEY = 'vampireos:gift-intro'; // Sofi's reaction to the empty gift folder has been heard to the end

const stage = document.getElementById('stage');
const themeMeta = document.querySelector('meta[name="theme-color"]');
let dispose = null;

function remember(name) {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Private mode: progress simply is not remembered.
  }
}

function recall() {
  try {
    const name = localStorage.getItem(STORAGE_KEY);
    return SCREENS[name] ? name : 'update';
  } catch {
    return 'update';
  }
}

// Sofi introduces Debug Mode once per playthrough, and reacts to the empty gift folder once.
// Like the chapter, both survive a reload (only once finished); they are also kept in memory,
// for a private window that cannot store them.
const heard = { intro: false, gift: false };
const heardKey = { intro: INTRO_KEY, gift: GIFT_KEY };

function isHeard(which) {
  if (heard[which]) return true;
  try {
    return localStorage.getItem(heardKey[which]) === '1';
  } catch {
    return false;
  }
}

function markHeard(which) {
  heard[which] = true;
  try {
    localStorage.setItem(heardKey[which], '1');
  } catch {
    // Private mode: remembered until the page is closed.
  }
}

const app = {
  introHeard: () => isHeard('intro'),
  markIntroHeard: () => markHeard('intro'),
  giftHeard: () => isHeard('gift'),
  markGiftHeard: () => markHeard('gift'),
  go(name, options) {
    if (dispose) dispose();
    if (name === 'update') music.dispose(); // the song belongs to Debug Mode onwards
    stage.innerHTML = '';
    stage.className = `stage stage--${name}`;
    app.theme(SCREENS[name].theme);
    remember(name);
    window.scrollTo(0, 0);
    dispose = SCREENS[name].mount(stage, app, options) || null;
  },
  theme(theme) {
    document.body.dataset.theme = theme;
    if (themeMeta) themeMeta.setAttribute('content', THEME_COLORS[theme]);
  },
  // PLAY AGAIN: the whole experience from the first screen. A real navigation to ?restart
  // (handled below) rather than a second reset path: the reload drops every timer, listener,
  // AudioContext and media element, and the restart branch clears the saved progression.
  restart() {
    window.location.replace(`${window.location.pathname}?restart`);
  },
};

// Warm up every typeface so the ending never flashes a fallback font.
// The first five are the opening's; the loader waits for them.
const FONTS = ['48px "Jacquard 24"', '19px "IM Fell English"', 'italic 19px "IM Fell English"', '20px "IM Fell English SC"', '19px "VT323"', '18px "Newsreader"', 'italic 29px "Newsreader"'];
const fontLoads = document.fonts && document.fonts.load ? FONTS.map((font) => document.fonts.load(font).catch(() => {})) : [];

// Initial loader: decode the sprites needed to show and wake Sofi before the first screen.
// Audio, photos and videos load later, on their own screens.
const CRITICAL_SPRITES = [sofiBlink, stillHere, stillHereFx, talking, talkingMouth, iSeeYou];
const decoded = []; // keeps the decoded images referenced

function preload() {
  const fill = document.querySelector('[data-loader-fill]');
  const tasks = [
    ...CRITICAL_SPRITES.map((src) => {
      const img = new Image();
      img.src = src;
      decoded.push(img);
      return img.decode().catch(() => {});
    }),
    ...fontLoads.slice(0, 5),
  ];
  let done = 0;
  tasks.forEach((task) =>
    task.then(() => {
      done += 1;
      if (fill) fill.style.width = `${Math.round((done / tasks.length) * 100)}%`;
    }),
  );
  // Never hang on a slow asset: after a few seconds, start anyway.
  return Promise.race([Promise.all(tasks), new Promise((resolve) => setTimeout(resolve, 6000))]);
}

// Reloading resumes the current chapter. Add ?restart to the URL to start over.
const params = new URLSearchParams(window.location.search);
if (params.has('restart')) {
  remember('update');
  try {
    localStorage.removeItem(INTRO_KEY); // a new playthrough: Sofi introduces Debug Mode again
    localStorage.removeItem(GIFT_KEY); // ...and reacts to the empty gift folder again
  } catch {
    // Private mode: nothing was stored.
  }
  music.dispose();
  window.history.replaceState(null, '', window.location.pathname);
}
preload().then(() => {
  app.go(recall());
  music.restore(); // a reload keeps the (paused) player once the song has been started
});
