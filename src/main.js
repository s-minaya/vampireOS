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

const app = {
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
  music.dispose();
  window.history.replaceState(null, '', window.location.pathname);
}
preload().then(() => {
  app.go(recall());
  music.restore(); // a reload keeps the (paused) player once the song has been started
});
