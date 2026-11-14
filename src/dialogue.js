// The speech bubble shared by Sofi (opening, Debug Mode intro) and Luis (from_luis.mp3):
// one bubble per line, a typewriter that pauses at punctuation, and the character's voice
// and mouth following the letters (SofiSpeech's rule: on for letters, off at pauses and at
// the end). Lines advance by themselves after a reading pause; a tap completes the line
// being typed and a tap on a finished line moves on. The lines are approved copy that the
// caller passes in; the voice is a createSpeechAudio instance the caller owns.

// Typewriter timing, from SofiSpeech's speechTimeline, slightly slowed for a phone.
const TYPE = { start: 380, char: 34, short: 190, long: 380 };
const READ = (text) => 1400 + text.length * 34; // pause before the next bubble

export const bubble = (name) => `
  <div class="op-bubble" data-ref="bubble" hidden>
    <span class="op-tail" aria-hidden="true"></span>
    <span class="op-name" aria-hidden="true">${name}</span>
    <span class="op-type">
      <span class="op-ghost" data-ref="ghost" aria-hidden="true"></span>
      <span class="op-typed" aria-hidden="true"><span data-ref="typed"></span><span class="op-caret" data-ref="caret"></span></span>
    </span>
    <span class="op-next" data-ref="next" aria-hidden="true"></span>
    <span class="sr-only" data-ref="live" aria-live="polite"></span>
  </div>
`;

function charKind(char) {
  if ('.…:?!'.includes(char)) return 'long';
  if (',;'.includes(char)) return 'short';
  if (/\s/.test(char)) return 'space';
  return 'letter';
}

// `host` contains the bubble markup; `mouth` gets `.is-speaking` while the voice is audible;
// `anchor` is scrolled into view for each line. `onDone` fires when the last line is typed
// (the voice may still be fading: see `quiet()`). Optional: `holds[i]` adds ms to the pause
// after line i, and `onPage(i, 'type' | 'read')` fires when line i starts typing and when it
// is finished (not for the last line), so a scene can change expression between bubbles.
export function createDialogue({ scope, host, lines, voice, mouth, anchor, onDone, holds, onPage }) {
  const ref = (name) => host.querySelector(`[data-ref="${name}"]`);
  let page = 0;
  let typeTimer = null;
  let readTimer = null;
  let speaking = false;
  let quietTimer = null;
  let quietAt = 0; // when the voice has fully faded (performance.now() ms)
  let lockedUntil = 0;

  // The mouth opens with the voice and closes when the voice has actually faded
  // (it finishes its syllable, at most ~150 ms into the pause).
  function setSpeaking(on) {
    if (speaking === on) return;
    speaking = on;
    if (quietTimer) scope.stop(quietTimer);
    quietTimer = null;
    if (on) {
      mouth.classList.add('is-speaking');
      voice.startVoice();
      return;
    }
    const tail = voice.stopVoice() || 0;
    quietAt = performance.now() + tail;
    if (tail > 0) {
      quietTimer = scope.after(tail, () => {
        quietTimer = null;
        mouth.classList.remove('is-speaking');
      });
    } else {
      mouth.classList.remove('is-speaking');
    }
  }

  // Shows the bubble and types the first line. Taps are ignored for `lockMs`, so the tap
  // that led here cannot skip the first line.
  function start(lockMs = 0) {
    ref('bubble').hidden = false;
    ref('bubble').classList.add('pop');
    lockedUntil = performance.now() + lockMs;
    playPage();
  }

  function playPage() {
    const text = lines[page];
    let index = 0;
    ref('ghost').textContent = text; // reserves this bubble's final size while it types
    anchor?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    ref('typed').textContent = '';
    ref('caret').hidden = false;
    ref('next').classList.remove('is-on');
    ref('live').textContent = text;
    onPage?.(page, 'type');

    const tick = () => {
      index += 1;
      const kind = charKind(text.charAt(index - 1));
      const done = index >= text.length;
      const pause = kind === 'long' || kind === 'short';
      // Voice and mouth move with the letters and stop at every pause, as in SofiSpeech.
      setSpeaking(done || pause ? false : kind === 'letter' ? true : speaking);
      ref('typed').textContent = text.slice(0, index);
      if (done) {
        typeTimer = null;
        pageDone();
        return;
      }
      typeTimer = scope.after(kind === 'long' ? TYPE.long : kind === 'short' ? TYPE.short : TYPE.char, tick);
    };
    typeTimer = scope.after(TYPE.start, tick);
  }

  function pageDone() {
    setSpeaking(false);
    ref('caret').hidden = true;
    if (page === lines.length - 1) {
      onDone?.();
      return;
    }
    ref('next').classList.add('is-on');
    onPage?.(page, 'read');
    readTimer = scope.after(READ(lines[page]) + (holds?.[page] || 0), nextPage);
  }

  function nextPage() {
    if (readTimer) scope.stop(readTimer);
    readTimer = null;
    page += 1;
    playPage();
  }

  // A tap while typing shows the whole bubble; a tap on a finished bubble moves on.
  function advance() {
    const now = performance.now();
    if (now < lockedUntil) return;
    lockedUntil = now + 250;
    if (typeTimer) {
      scope.stop(typeTimer);
      typeTimer = null;
      ref('typed').textContent = lines[page];
      pageDone();
    } else if (readTimer) {
      nextPage();
    }
  }

  // Never leave the voice looping in a background tab.
  const onVisibility = () => {
    if (document.hidden) setSpeaking(false);
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    start,
    advance,
    quiet: () => Math.max(0, quietAt - performance.now()), // ms until the voice has faded
    dispose() {
      document.removeEventListener('visibilitychange', onVisibility);
      [typeTimer, readTimer, quietTimer].forEach((id) => id && scope.stop(id));
      typeTimer = readTimer = quietTimer = null;
      setSpeaking(false);
    },
  };
}
