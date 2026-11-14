import songUrl from './assets/davids-theme.mp3';

// Luis's song and its persistent player. One <audio> element for the whole app, owned here
// rather than by any screen, so moving between screens never restarts or doubles it. It is
// started only from the PLAY TRACK card (a user gesture) and loops for as long as it plays.
//
// Media that must not play over the song calls hold(reason) and release(reason): the song
// pauses and, once every hold is released, resumes only if it was playing before. Luis's
// entrance uses it on a replay; emo_mode.mp4 (emo.js) does the same while its video plays.

export const TRACK = { title: 'davids_theme.wav', artist: 'Luis', duration: 170.4 };

const STARTED_KEY = 'vampireos:track'; // the track has been started: keep the player after a reload
const DEFAULT_VOLUME = 0.8; // the master peaks at 0 dBFS

const icon = {
  play: '<svg class="mp-ico mp-ico--play" aria-hidden="true" viewBox="0 0 8 10" width="14" height="18" shape-rendering="crispEdges"><path fill="currentColor" d="M1 0h2v1h1v1h1v1h1v1h1v2H6v1H5v1H4v1H3v1H1z"/></svg>',
  pause: '<svg class="mp-ico mp-ico--pause" aria-hidden="true" viewBox="0 0 8 10" width="14" height="18" shape-rendering="crispEdges"><path fill="currentColor" d="M1 0h2v10H1zM5 0h2v10H5z"/></svg>',
  speaker:
    '<svg class="mp-ico" aria-hidden="true" viewBox="0 0 13 11" width="22" height="19" shape-rendering="crispEdges"><path fill="currentColor" d="M0 3h2v5H0zM2 3h1V2h1V1h1V0h1v11H5v-1H4V9H3V8H2z"/><path class="mp-wave1" fill="currentColor" d="M8 4h1v3H8z"/><path class="mp-wave2" fill="currentColor" d="M10 2h1v1h1v5h-1v1h-1V8h1V3h-1z"/><path class="mp-mute" fill="currentColor" d="M8 3h1v1h1v1h1V4h1V3h1v1h-1v1h-1v1h1v1h1v1h-1V7h-1V6h-1v1H9v1H8V7h1V6h1V5H9V4H8z"/></svg>',
};

let audio = null;
let bar = null;
let dragging = false;
let resumeOnRelease = false;
const holds = new Set();
const listeners = new Set();

const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // Private mode: nothing is remembered.
    }
  },
};

const clock = (t) => {
  const s = Math.max(0, Math.floor(t || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const duration = () => (audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : TRACK.duration);

function state() {
  return {
    shown: Boolean(bar),
    playing: Boolean(audio && !audio.paused),
    time: audio ? audio.currentTime : 0,
    duration: duration(),
  };
}

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = 'metadata';
  audio.loop = true; // the end runs straight back into the start
  audio.src = songUrl;
  audio.volume = DEFAULT_VOLUME; // fixed level; the bar only mutes (audio.muted)
  for (const type of ['play', 'pause', 'timeupdate', 'durationchange', 'loadedmetadata', 'seeked', 'volumechange', 'emptied']) {
    audio.addEventListener(type, sync);
  }
  // Should a browser ever ignore loop, start again at once.
  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    void audio.play().catch(sync);
  });
  return audio;
}

// ── Public API ───────────────────────────────────────────────────────────

// Loads the file's metadata (not the song) so PLAY starts quickly. No sound.
function prepare() {
  ensureAudio();
}

// Must run inside a user gesture the first time.
function play() {
  ensureAudio();
  showBar();
  store.set(STARTED_KEY, '1');
  resumeOnRelease = false;
  if (!audio.paused) return;
  void audio.play().catch(sync); // blocked or failed: the controls simply show paused
}

function pause() {
  resumeOnRelease = false;
  if (audio) audio.pause();
}

function toggle() {
  if (audio && !audio.paused) pause();
  else play();
}

function seek(seconds) {
  if (!audio) return;
  audio.currentTime = Math.min(Math.max(0, seconds), duration() - 0.05);
  sync();
}

function hold(reason) {
  if (!audio) return;
  if (!holds.size) resumeOnRelease = !audio.paused;
  holds.add(reason);
  audio.pause();
}

function release(reason) {
  if (!holds.delete(reason) || holds.size) return;
  if (resumeOnRelease && audio && audio.paused) void audio.play().catch(sync);
  resumeOnRelease = false;
}

function subscribe(fn) {
  listeners.add(fn);
  fn(state());
  return () => listeners.delete(fn);
}

// After a reload, bring back the (paused) player if David had already started the song.
function restore() {
  if (store.get(STARTED_KEY)) {
    ensureAudio();
    showBar();
  }
}

// Stops the song and removes the player (a restart from the first screen).
function dispose() {
  store.set(STARTED_KEY, null);
  holds.clear();
  resumeOnRelease = false;
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load(); // drops the download and the decoder
    audio = null;
  }
  if (bar) {
    bar.remove();
    bar = null;
    document.body.classList.remove('has-player');
  }
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null;
    for (const action of ['play', 'pause', 'seekto']) setAction(action, null);
  }
  sync();
}

export const music = { prepare, play, pause, toggle, seek, hold, release, subscribe, restore, dispose };

// ── The bar ──────────────────────────────────────────────────────────────

function setAction(action, handler) {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // unsupported action
  }
}

function showBar() {
  if (bar) return;
  bar =document.createElement('div');
  bar.className = 'mp enter';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', `Music player: ${TRACK.title}`);
  bar.innerHTML = `
    <button class="mp-play" data-mp="toggle" aria-label="Play ${TRACK.title}">${icon.play}${icon.pause}<span class="mp-word"></span></button>
    <div class="mp-mid">
      <div class="mp-top">
        <span class="mp-eq" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="mp-title">${TRACK.title}</span>
        <span class="mp-time" aria-hidden="true"><span data-mp="now">0:00</span> / <span data-mp="dur">${clock(duration())}</span></span>
      </div>
      <input class="mp-seek" data-mp="seek" type="range" min="0" max="${duration()}" step="0.1" value="0" aria-label="Seek ${TRACK.title}">
    </div>
    <button class="mp-vol" data-mp="mute" aria-pressed="false" aria-label="Mute ${TRACK.title}">${icon.speaker}<span class="mp-word">Mute</span></button>
  `;
  const el = (name) => bar.querySelector(`[data-mp="${name}"]`);

  el('toggle').addEventListener('click', toggle);
  const seeker = el('seek');
  seeker.addEventListener('input', () => {
    dragging = true;
    paintTime(Number(seeker.value));
  });
  seeker.addEventListener('change', () => {
    dragging = false;
    seek(Number(seeker.value));
  });

  // Mutes only the song element; playback and position are untouched.
  el('mute').addEventListener('click', () => {
    if (audio) audio.muted = !audio.muted;
  });

  document.body.append(bar);
  document.body.classList.add('has-player');

  if ('mediaSession' in navigator && 'MediaMetadata' in window) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: TRACK.title, artist: TRACK.artist, album: 'VampireOS' });
    setAction('play', play);
    setAction('pause', pause);
    setAction('seekto', (details) => seek(details.seekTime));
  }
  sync();
}

function paintTime(time) {
  const total = duration();
  const seeker = bar.querySelector('[data-mp="seek"]');
  seeker.style.setProperty('--p', `${Math.min(100, (time / total) * 100)}%`);
  seeker.setAttribute('aria-valuetext', `${clock(time)} of ${clock(total)}`);
  bar.querySelector('[data-mp="now"]').textContent = clock(time);
}

function sync() {
  const now = state();
  if (bar) {
    bar.classList.toggle('is-playing', now.playing);
    const toggleBtn = bar.querySelector('[data-mp="toggle"]');
    toggleBtn.setAttribute('aria-label', `${now.playing ? 'Pause' : 'Play'} ${TRACK.title}`);
    toggleBtn.querySelector('.mp-word').textContent = now.playing ? 'Pause' : 'Play';
    const seeker = bar.querySelector('[data-mp="seek"]');
    seeker.max = String(now.duration);
    bar.querySelector('[data-mp="dur"]').textContent = clock(now.duration);
    if (!dragging) {
      seeker.value = String(now.time);
      paintTime(now.time);
    }
    const muted = Boolean(audio && audio.muted);
    const muteBtn = bar.querySelector('[data-mp="mute"]');
    muteBtn.dataset.level = muted ? '0' : '2';
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', `${muted ? 'Unmute' : 'Mute'} ${TRACK.title}`);
    muteBtn.querySelector('.mp-word').textContent = muted ? 'Unmute' : 'Mute';
  }
  if ('mediaSession' in navigator && bar) navigator.mediaSession.playbackState = now.playing ? 'playing' : 'paused';
  listeners.forEach((fn) => fn(now));
}
