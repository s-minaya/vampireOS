import videoUrl from '../assets/emo-mode.mp4';
import posterUrl from '../assets/emo-mode-poster.webp';
import { createScope } from '../util.js';
import { music } from '../music.js';

// DO_NOT_OPEN/emo_mode.mp4: David's fringe video, investigated as a hair-physics incident.
// The file is an unmodified copy of video-flequillo-emo.mp4 (576x1024, 15.1 s, H.264 + AAC,
// index at the front) and is shown whole at 9:16. A short scan ends in the approved warning
// over its first frame (emo-mode-poster.webp); only the file's metadata is fetched until David
// presses play. While it plays nothing covers the picture except a small flag in the bottom
// corner: the diagnostics live in the side rails and the caption, timed to what the fringe
// really does. The video has its own sound, so Luis's song is held (music.js) while it plays.

// Approved warning: keep verbatim.
const WARNING = 'WARNING: UNAUTHORIZED HAIR ANIMATION DETECTED.';

const DURATION = 15.13; // seconds, until the file's own metadata arrives
const FRAMES = 453;
const HOLD = 'emo'; // this view's hold on the song

// How much the hair moves, ten samples a second (0: still, 9: a full flip). Measured once from
// the file itself (frame differences around the head), so the meters follow the real footage.
const MOTION =
  '11000000000000000000002567876446653234565321134799997410023344322355432135654322112343235676678764235543222455557887654333344464101123456874234443333456';
const LEVELS = [...MOTION].map(Number);
const TOTAL_MOTION = LEVELS.reduce((sum, level) => sum + level, 0);
const EMO = LEVELS.reduce((list, level) => {
  list.push((list.length ? list[list.length - 1] : 0) + level);
  return list;
}, []).map((sum) => Math.round((sum / TOTAL_MOTION) * 100)); // % of the clip's motion so far: 100 at the end

// [seconds, machine line, VampireOS's remark, hair event number]: what happens in the video, and when.
// The remarks are set in IM Fell, whose old-style figures read badly: keep digits out of them.
const CUES = [
  [0, 'BASELINE: FRINGE AT REST', 'The subject is perfectly still. Eyes: not found. All is as it should be.', 0],
  [2.4, 'FRINGE DISPLACEMENT DETECTED', 'It moved. No instruction to move was ever issued.', 1],
  [3.9, 'ALERT: FOREHEAD EXPOSED', 'An eye has become visible. This was not in the specification.', 2],
  [5.1, 'FRINGE RESTORED TO DEFAULT', 'The eyes are gone again. We shall not speak of it.', 0],
  [6.7, 'SUBJECT SHOWS NO REMORSE', 'He appears to find this amusing. The diagnostics do not.', 0],
  [9.1, 'REPEAT INCIDENT', 'A second flip. This one was plainly deliberate.', 3],
  [11, 'MANUAL OVERRIDE: HAND IN HAIR', 'The subject is now animating it by hand. Brazen.', 4],
  [13.4, 'HAIR RETURNING TO IDLE', 'It settles, as though nothing whatsoever had occurred.', 0],
];
const EVENTS = CUES.filter((cue) => cue[3]).length;

const QUARANTINE = ['FOOTAGE QUARANTINED', 'A fringe was caught moving with no physics engine installed. Review at your own risk.'];
const VERDICT = ['VERDICT: EMO MODE CANNOT BE DISABLED', 'The animation remains unauthorized. It is also, regrettably, rather good.'];
const FAILURE = ['EVIDENCE COULD NOT BE LOADED', 'The footage declined to appear. Close the file and open it again.'];

// The scan before the warning: [line, finding, finding's colour].
const LOG = [
  ['MOUNTING emo_mode.mp4...', 'OK', ''],
  ['HAIR PHYSICS ENGINE:', 'NOT INSTALLED', ''],
  ['HAIR MOVEMENT:', 'DETECTED ANYWAY', 'c-red'],
];
const LOG_STEP = 600; // ms between lines
const BOX_AT = 1500; // the tracker finds the hair
const ALARM_AT = 2200; // the warning
const TAP_GUARD = 400; // ms: a double tap on the file's row must not land on the video

const SEGMENTS = 14; // per meter
const meter = (name) => `<span class="emo-meter" data-emo="${name}" aria-hidden="true">${'<i></i>'.repeat(SEGMENTS)}</span>`;

const icon = {
  play: '<svg class="emo-ico emo-ico--play" aria-hidden="true" viewBox="0 0 8 10" width="14" height="18" shape-rendering="crispEdges"><path fill="currentColor" d="M1 0h2v1h1v1h1v1h1v1h1v2H6v1H5v1H4v1H3v1H1z"/></svg>',
  pause: '<svg class="emo-ico emo-ico--pause" aria-hidden="true" viewBox="0 0 8 10" width="14" height="18" shape-rendering="crispEdges"><path fill="currentColor" d="M1 0h2v10H1zM5 0h2v10H5z"/></svg>',
  warn: '<svg class="emo-warn-ico" aria-hidden="true" viewBox="0 0 11 10" width="22" height="20" shape-rendering="crispEdges"><path fill="currentColor" fill-rule="evenodd" d="M5 0h1v1h1v2h1v2h1v2h1v2h1v1H0V9h1V7h1V5h1V3h1V1h1zM5 3h1v3H5zM5 7h1v1H5z"/></svg>',
};

const [warnHead, ...warnRest] = WARNING.split(' ');

const body = `
  <div class="emo-main">
    <div class="emo-side">
      <span>FRINGE</span>
      ${meter('vel')}
      <span class="emo-value"><b data-emo="vel-text">-.-</b>m/s</span>
    </div>
    <div class="emo-stage" data-emo="stage">
      <video class="emo-video" data-emo="video" src="${videoUrl}" poster="${posterUrl}" preload="metadata" playsinline webkit-playsinline disablepictureinpicture disableremoteplayback aria-label="David's fringe video"></video>
      <i class="emo-box" data-emo="box" aria-hidden="true" hidden><b class="emo-tag" data-emo="box-tag">HAIR</b></i>
      <i class="emo-corners" aria-hidden="true"></i>
      <i class="emo-beam" aria-hidden="true"></i>
      <span class="emo-flag" data-emo="flag" hidden></span>
      <div class="emo-warn" data-emo="warn" hidden>
        <p class="emo-warn-text" role="alert"><span class="emo-warn-head">${icon.warn}${warnHead}</span> ${warnRest.join(' ')}</p>
        <button class="key key--primary emo-go" data-go="play">REVIEW EVIDENCE</button>
      </div>
      <div class="emo-end" data-emo="end" hidden>
        <div class="emo-stamp">CASE CLOSED</div>
        <div class="emo-report">
          <div><span>FRAMES REVIEWED</span><b>${FRAMES}</b></div>
          <div><span>HAIR EVENTS</span><b>${EVENTS}</b></div>
          <div><span>PERMITS ON FILE</span><b>0</b></div>
          <div><span>EMO LEVEL</span><b class="c-red">100%</b></div>
        </div>
        <button class="key key--primary" data-go="replay">REPLAY</button>
        <button class="key" data-go="close">CLOSE FILE</button>
      </div>
    </div>
    <div class="emo-side">
      <span>EMO</span>
      ${meter('emo')}
      <span class="emo-value"><b data-emo="emo-text">--</b>%</span>
    </div>
  </div>
  <div class="emo-caption">
    <div class="emo-log" data-emo="log" role="status"></div>
    <div class="emo-title" data-emo="title" hidden></div>
    <p class="emo-note voice" data-emo="note" hidden></p>
  </div>
  <div class="emo-transport">
    <button class="emo-play" data-emo="toggle" data-go="toggle" aria-label="Play video">${icon.play}${icon.pause}</button>
    <input class="emo-seek" data-emo="seek" type="range" min="0" max="${DURATION}" step="0.01" value="0" aria-label="Seek video" disabled>
    <span class="emo-time" aria-hidden="true"><span data-emo="now">0:00</span> / <span data-emo="dur">0:15</span></span>
  </div>
`;

const clock = (t) => {
  const s = Math.max(0, Math.floor(t || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const cueAt = (t) => {
  let index = 0;
  while (index + 1 < CUES.length && CUES[index + 1][0] <= t) index += 1;
  return index;
};

// The first frame, fetched when the folder opens so the file's window is never empty.
let poster = null;
export function preloadEmo() {
  if (poster) return;
  poster = new Image();
  poster.src = posterUrl;
  poster.decode().catch(() => {});
}

// `win` is the explorer window, already holding its title bar; onClose returns to the folder.
export function mountEmo(win, { onClose }) {
  const scope = createScope();
  win.insertAdjacentHTML('beforeend', body);
  win.dataset.state = 'intro'; // intro | ready | playing | paused | ended | error
  const ref = (name) => win.querySelector(`[data-emo="${name}"]`);
  const el = Object.fromEntries(
    ['stage', 'video', 'box', 'box-tag', 'flag', 'warn', 'end', 'vel', 'vel-text', 'emo', 'emo-text', 'log', 'title', 'note', 'toggle', 'seek', 'now', 'dur'].map((name) => [name, ref(name)]),
  );
  const video = el.video;
  const mountedAt = performance.now();

  let phase = 'intro'; // intro: the scan → ready: the warning, waiting for play → live: the video's own state
  let disposed = false;
  let failed = false;
  let waiting = false; // playing, but the next frame has not arrived
  let holding = false; // this view's hold on the song is in place
  let dragging = false;
  let frame = 0; // the repaint loop, while the video plays
  let shown = null; // the caption on display: a cue's index, 'verdict' or 'error'
  let eventFlag = '';
  let flagTimer = 0;
  let hotTimer = 0;

  // As in the other files: settle the window's end above the music player (debug.js has just
  // scrolled the new view to the top). Not on `scope`: skipping the scan must not cancel it.
  const settleTimer = setTimeout(() => win.scrollIntoView({ block: 'end', behavior: 'smooth' }), 360);

  // Writes to the page only when a value has changed: paint() runs on every frame.
  const painted = {};
  const set = (key, value, apply) => {
    if (painted[key] === value) return;
    painted[key] = value;
    apply(value);
  };
  const fill = (bar, count) => [...bar.children].forEach((segment, i) => segment.classList.toggle('is-on', i < count));

  function caption([title, note], alert = false) {
    el.log.hidden = true;
    el.title.hidden = false;
    el.note.hidden = false;
    el.title.textContent = title;
    el.note.textContent = note;
    el.title.classList.remove('is-alert');
    if (alert) {
      void el.title.offsetWidth; // so the alarm blinks again
      el.title.classList.add('is-alert');
    }
  }

  // The system flinches: the rails and the caption jump, the frame turns red. Never the picture.
  function jolt() {
    for (const part of win.querySelectorAll('.emo-side, .emo-caption')) {
      part.classList.remove('emo-jolt');
      void part.offsetWidth;
      part.classList.add('emo-jolt');
    }
    el.stage.classList.add('is-hot');
    scope.stop(hotTimer);
    hotTimer = scope.after(700, () => el.stage.classList.remove('is-hot'));
  }

  // ── The scan, then the warning ──
  LOG.forEach(([text, finding, tone], i) => {
    scope.after(100 + i * LOG_STEP, () => {
      const length = text.length + finding.length + 3;
      el.log.insertAdjacentHTML('beforeend', `<div><span class="emo-type" style="--n:${length}">&gt; ${text} <span class="${tone}">${finding}</span></span></div>`);
    });
  });
  scope.after(BOX_AT, () => {
    el.box.hidden = false;
  });
  scope.after(ALARM_AT, ready);

  function ready() {
    if (phase !== 'intro') return;
    phase = 'ready';
    scope.dispose(); // whatever was left of the scan
    win.dataset.state = 'ready';
    el.box.hidden = false;
    el.box.classList.add('is-alert');
    el['box-tag'].textContent = 'ANOMALY';
    el.warn.hidden = false;
    win.classList.add('shake');
    caption(QUARANTINE);
  }

  // ── The video ──
  function goLive() {
    if (phase === 'live') return;
    phase = 'live';
    scope.dispose();
    win.classList.remove('shake');
    el.warn.hidden = true;
    el.box.hidden = true;
    el.seek.disabled = false;
  }

  // Must run inside a tap: the video has sound.
  function play() {
    if (failed) return;
    goLive();
    if (video.ended) video.currentTime = 0;
    holding = true;
    music.hold(HOLD); // before the first sample, not on the `play` event that follows it
    const attempt = video.play();
    if (attempt) attempt.catch(refresh); // refused or interrupted: refresh() hands the song back
    refresh();
  }

  // Everything that depends on the video's state. The song is held exactly while the video is
  // actually playing, and released when it pauses, ends or fails: music.js resumes the song
  // where it stopped, and only if it was playing before.
  function refresh() {
    if (disposed || phase !== 'live') return;
    const state = failed ? 'error' : video.ended ? 'ended' : video.paused ? 'paused' : 'playing';
    const active = state === 'playing';
    if (active !== holding) {
      holding = active;
      if (active) music.hold(HOLD);
      else music.release(HOLD);
    }
    if (active && !frame) frame = requestAnimationFrame(loop);
    if (!active) {
      cancelAnimationFrame(frame);
      frame = 0;
      waiting = false;
    }
    if (win.dataset.state !== state) {
      win.dataset.state = state;
      el.end.hidden = state !== 'ended';
      el.toggle.setAttribute('aria-label', active ? 'Pause video' : state === 'ended' ? 'Replay video' : 'Play video');
    }
    paint();
  }

  function loop() {
    frame = requestAnimationFrame(loop);
    paint();
  }

  // Everything that depends on the video's position, so pausing, seeking and replaying all work.
  function paint() {
    const total = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : DURATION;
    const ended = video.ended;
    const t = ended ? total : Math.min(video.currentTime, total);

    set('max', total, (value) => {
      el.seek.max = String(value);
      el.dur.textContent = clock(value);
    });
    set('time', Math.round(t * 50), () => {
      if (!dragging) el.seek.value = String(t);
      el.seek.style.setProperty('--p', `${(t / total) * 100}%`);
    });
    set('now', clock(t), (text) => {
      el.now.textContent = text;
      el.seek.setAttribute('aria-valuetext', `${text} of ${clock(total)}`);
    });

    // The rails: how fast the fringe is moving, and how much of the incident has taken place.
    const i = Math.min(LEVELS.length - 1, Math.floor(t * 10));
    const level = ended ? 0 : LEVELS[i];
    const emo = ended ? 100 : EMO[i];
    set('vel', Math.round((level / 9) * SEGMENTS), (count) => fill(el.vel, count));
    set('velText', (level * 0.4 + (level ? (i % 4) / 10 : 0)).toFixed(1), (text) => {
      el['vel-text'].textContent = text;
    });
    set('emo', Math.round((emo / 100) * SEGMENTS), (count) => fill(el.emo, count));
    set('emoText', String(emo), (text) => {
      el['emo-text'].textContent = text;
    });

    // The caption: the cue for this moment. A hair event reached by playing (not by seeking)
    // also makes the system flinch.
    const key = failed ? 'error' : ended ? 'verdict' : cueAt(t);
    if (key !== shown) {
      const previous = shown;
      shown = key;
      if (key === 'error') caption(FAILURE);
      else if (key === 'verdict') caption(VERDICT);
      else {
        const [, title, note, event] = CUES[key];
        caption([title, note], Boolean(event));
        if (event && previous === key - 1 && !video.paused && !video.seeking) react(event);
      }
    }
    paintFlag();
  }

  function react(event) {
    jolt();
    eventFlag = `HAIR EVENT ${event}/${EVENTS}`;
    scope.stop(flagTimer);
    flagTimer = scope.after(1600, () => {
      eventFlag = '';
      paintFlag();
    });
  }

  function paintFlag() {
    const state = win.dataset.state;
    const text = state === 'paused' ? 'PAUSED' : state !== 'playing' ? '' : waiting ? 'BUFFERING...' : eventFlag;
    set('flag', text, () => {
      el.flag.textContent = text;
      el.flag.hidden = !text;
    });
  }

  const onWaiting = () => {
    waiting = !video.paused;
    if (phase === 'live') paint();
  };
  const onFlowing = () => {
    waiting = false;
    if (phase === 'live') paint();
  };
  const onError = () => {
    failed = true;
    goLive();
    refresh();
  };
  const STATE_EVENTS = ['play', 'pause', 'ended', 'seeking', 'seeked', 'timeupdate', 'loadedmetadata', 'durationchange', 'emptied'];
  STATE_EVENTS.forEach((type) => video.addEventListener(type, refresh));
  video.addEventListener('waiting', onWaiting);
  video.addEventListener('playing', onFlowing);
  video.addEventListener('canplay', onFlowing);
  video.addEventListener('error', onError);

  // Should the song be started from its own bar while the video plays, the video gives way:
  // the two are never heard together.
  const unsubscribe = music.subscribe(({ playing }) => {
    if (playing && !video.paused && !video.ended) video.pause();
  });

  // ── Controls ──
  const actions = {
    play,
    toggle: () => (win.dataset.state === 'playing' ? video.pause() : play()),
    replay: () => {
      video.currentTime = 0;
      play();
    },
    close: () => onClose(),
  };
  const onClick = (event) => {
    const button = event.target.closest('[data-go]');
    if (button) {
      actions[button.dataset.go]();
      return;
    }
    if (!event.target.closest('.emo-stage')) return;
    // Tapping the picture: skips the scan, then plays and pauses.
    if (phase === 'intro') {
      if (performance.now() - mountedAt > TAP_GUARD) ready();
    } else if (!['ended', 'error'].includes(win.dataset.state)) actions.toggle();
  };
  win.addEventListener('click', onClick);

  const onSeekInput = () => {
    dragging = true;
    video.currentTime = Number(el.seek.value);
    paint();
  };
  const endDrag = () => {
    dragging = false;
  };
  el.seek.addEventListener('input', onSeekInput);
  for (const type of ['change', 'pointerup', 'pointercancel', 'touchend', 'touchcancel']) el.seek.addEventListener(type, endDrag);

  // The seek bar's listeners go with the view's markup.
  return {
    dispose() {
      disposed = true;
      clearTimeout(settleTimer);
      scope.dispose();
      cancelAnimationFrame(frame);
      unsubscribe();
      win.removeEventListener('click', onClick);
      STATE_EVENTS.forEach((type) => video.removeEventListener(type, refresh));
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onFlowing);
      video.removeEventListener('canplay', onFlowing);
      video.removeEventListener('error', onError);
      video.pause();
      video.removeAttribute('src');
      video.load(); // drops the download and the decoder
      holding = false;
      music.release(HOLD); // the video is silent now: the song carries on if it was playing before
    },
  };
}
