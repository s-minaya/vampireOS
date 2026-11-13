# Sofi: sprites, dialogue and voice — technical handoff

Narrative and approved behaviour live in `VAMPIREOS.md` (beat 1). This file only covers how the opening is built, so future changes don't break it.

## Files

| File | Responsibility |
|---|---|
| `src/screens/opening.js` | Sofi scene in the update window: wake interaction, 009 reaction, and her lines. `mountOpening(host, { scope, onWake, onDone, lines, awake })` returns `{ dispose }`; `awake` skips the wake-up (Debug Mode intro). |
| `src/dialogue.js` | The bubble itself, shared with Luis: `bubble(name)` markup and `createDialogue({ scope, host, lines, voice, mouth, anchor, onDone })` (typewriter, pauses, voice start/stop, `.is-speaking` on `mouth`). Bubble colour is `--bubble` (pink unless a scene overrides it; Luis's `.lz-win` sets his neon). |
| `src/screens/update.js` | Mounts the opening (`showPrompt`), reacts to `onWake` (boot line `asleep` → `confused`), and on `onDone(op)` renders the prompt, moves the scene into `[data-ref="guide"]` as `.op.is-compact`, then reveals the choices. Also the `ARE YOU SURE?`, refusal removal and install flow. |
| `src/speechAudio.js` | Sofi's voice (Web Audio). Plain-JS port of Ask Sofi's `speechAudio.ts`, reworked for fluid playback. |
| `src/main.js` | Initial loader: decodes the critical sprites (`CRITICAL_SPRITES`) and opening fonts before the first screen; 6 s timeout. Loader markup and inline style are in `index.html`. |
| `src/styles.css` | `.op*` (scene, meter, bubble, compact layout), `.sofi-sprite` layers and states, `.u-choices` / `.u-beckon` / `.u-refuse.is-revoked`. |
| `src/assets/` | `sofi-blink.webp`, `are-u-still-here.webp` + `-fx.webp` (008), `talking.webp` + `talking-mouth.webp` (004), `i-see-you.webp` (009), `talking-sound.mp3`. |

Source packages are in the repo root (`004-talking.zip`, `008-are-u-still-here.zip`, `009-i-see-you.zip`) and in `Ask Sofi/spritesheets/spritesheet`. Their SCSS was **hand-compiled** into `styles.css`. All boxes are percentages of a 384 px frame. Talking keyframes (`sofi-talk-eyes`, `sofi-talk-mouth`, 6.41 s) were generated from `_talking.scss`. The 009 values keep the original **ceil** rounding, which keeps the faces pixel-aligned at 192 px. If you change a sprite, recompute from the original SCSS; don't guess the percentages.

## Sprite states

There is one element, `.sofi-sprite`, and its state lives in `data-sofi` (with `data-lids` for drowsy). The child layers are `body > pose/lids/mouth`, `talk`, `face`, `sparkle`, `z1–z3` and `burst`. Each layer is hidden unless the current state shows it.

- `asleep` / `nodding` / `startled`: 008 poses in the `pose` layer; the host has no background. Zzz show only while `asleep`; `burst` plays on `startled`.
- `drowsy`: the host shows sofi-blink frame 1, with the 008 lids (`heavy` or `heavier`) and mouth on top.
- `talking`: the host shows `talking.webp` with its blink loop. The mouth (`talk` layer) animates **only** while `.is-speaking` is set; otherwise it shows the closed mouth.
- `smirk` / `tease` / `giggle`: the host shows sofi-blink frame 0 with the 009 `face` layer. `sparkle` is shown during tease and giggle, and the giggle hop is on the host.
- `.is-poked`: per-tap squash on the host. It is removed when talking starts so it can't fight the talking animation.

## Flow in `opening.js`

`phase` is one of `asleep → waking → talking → reacting → done`. Clicks are handled by one listener on `.op`, which **only** responds in `asleep` (poke) and `talking` (advance).

1. **Wake.** Each tap keeps only the taps from the last `WAKE_WINDOW` (4 s); 6 taps calls `wake()`. `paint(level)` maps the tap count through `LEVELS` to a pose, the meter and the status word. Each tap re-arms `DOZE_AFTER` (2 s). When it fires, `dozeOff()` resets the taps immediately and drains one level every `DOZE_STEP` back to `asleep`, then changes the hint. Tapping Sofi is the only wake control (Enter on the button counts as a tap).
2. **Startled → talking.** `wake()` sets the `startled` pose and calls `onWake`. After `STARTLED_MS`, `startTalking()` runs. A ~900 ms `lockedUntil` stops the last wake taps from skipping the first line.
3. **Dialogue** (`dialogue.js`). There is one bubble per entry in `LINES`; the text is approved, so don't edit it here. `playPage()` puts the full line in a hidden ghost span to reserve the bubble's final size, then reveals one character per tick (`TYPE` delays: letters, `,;` short pause, `.…:?!` long pause). The speaking flag follows the SofiSpeech rule: on for letters, off at punctuation and at the end, unchanged for spaces. A tap while typing completes the line; a tap on a finished line goes to the next one. Otherwise lines advance automatically after `READ(text)`.
4. **Reaction.** After the last line, `react()` waits until the voice has faded (`quietAt`) plus `REACTION_DELAY`, plays `REACTION` (smirk 900 → tease 1300 → giggle 1200 → smirk 800 ms), sets the pose back to `talking` (rest), and calls `onDone(op)`.
5. **Choices (`update.js`).** The buttons start with `.is-pending` (`visibility: hidden`, so space is reserved and nothing jumps). After `CHOICE_DELAY`, ACCEPT MY FATE appears (primary, `.u-beckon` flashing lines). `REFUSE_DELAY` later, the plain I REFUSE appears.

## Voice and mouth sync (`speechAudio.js`)

API: `prepare()`, `startVoice()`, `stopVoice() → ms still audible`, `dispose()`, `getStatus()`.

- **Unlock.** `prepare()` must run inside a user gesture; every poke calls it. The mp3 is fetched when the scene mounts and decoded on the first tap. If audio is blocked or unavailable, the dialogue still runs silently.
- **Analysis.** After decoding, the clip is mapped into 10 ms loudness windows. *Phrases* are stretches of voice; silences of `GAP` (90 ms) or more are skipped. *Dips* (`< DIP`) are syllable boundaries.
- **Start.** `play()` resumes from `cursor` within the current phrase, or from the next phrase's onset. It fades in over `FADE_IN` and plays only to the end of the phrase. `onended` then chains straight into the next phrase, so the clip's silences are never heard while letters type.
- **Stop.** `stopVoice()` lets the voice reach the next syllable dip (at most `SETTLE`, 120 ms), fades out over `FADE_OUT` (35 ms), and stores the resume point. It returns the remaining milliseconds.
- **No overlap.** There is at most one speaking source, plus a `tail` that is still fading. `startVoice()` silences any tail first.
- **Mouth.** `setSpeaking(false)` keeps `.is-speaking` on until the returned tail has elapsed (`quietTimer`), so the mouth closes when the voice does. Don't go back to a hard `source.stop()` or to looping the whole clip: that was the cause of the chopped sound.

## Lifecycle constraints

- Every timer goes through the screen's `createScope()` (`scope.after` / `scope.stop`). `update.js` disposes the scope when the screen unmounts.
- `opening.dispose()` removes the click and `visibilitychange` listeners, stops pending timers, silences the voice and closes the AudioContext. `update.js` calls it before installing and on unmount; keep both calls.
- A hidden tab forces `setSpeaking(false)`, so the voice never loops in the background.
- `revealChoices` *moves* the existing `.op` node instead of re-rendering it. The sprite and audio closures live on, and the CSS animations restart.
- `prefers-reduced-motion` is deliberately **not** honoured (see `VAMPIREOS.md`). Don't add reduced-motion overrides.
- New sprite sheets the opening needs must be added to `CRITICAL_SPRITES` in `main.js`; otherwise they can pop in mid-animation. Audio and media must not be added there.

## Verifying changes

1. Run `npm run build`, then `npx vite preview` and open `/?restart` at a phone width (390 px; also check about 664 px tall).
2. Check manually:
   - 4 taps make her drowsy; 2 s idle drains her back to asleep with the new hint.
   - 6 slow taps (about 0.9 s apart) don't wake her; 6 quick ones do.
   - The mouth moves only with letters and the bubble never jumps size.
   - Smirk → tease → giggle → smirk plays before any button.
   - ACCEPT appears, then REFUSE; NO, refusal removal and accept → install → failure all work.
   - No console errors.
3. For audio changes, record the real output instead of trusting constants. A useful method: wrap `AudioNode.prototype.connect` in an init script to tap the destination with a ScriptProcessor, then compare loudness while letters type with the typewriter state. Targets from the last verification: about 92–94% audible while typing, 0 dropouts of 60 ms or more, 0–1 hard cuts, 1 concurrent source, about 97% mouth/voice agreement.

## Known limitations

- Verified only in headless Edge (desktop Chromium) with a touch viewport. Real iOS Safari, the mute switch, real speakers and toolbar heights are untested.
- Audio quality was measured, not listened to. After pauses the voice runs on for about 140 ms on average (up to about 180 ms) by design.
- Reloading on the update screen replays the opening from the asleep state.
- `src/speechAudio.ts` is the unused original; the app imports `speechAudio.js`.
- Exact `ARE YOU SURE?` microcopy is still a placeholder (pending in `VAMPIREOS.md`).

## Luis: from_luis.mp3 (Debug Mode)

Narrative: `VAMPIREOS.md` beat 3 (his note is the approved text in `LINES`). The song itself and its player are **not** implemented; the scene ends on an `ATTACHED TRACK … [ player pending ]` card.

### Files and assets

| File | Responsibility |
|---|---|
| `src/screens/luis.js` | `mountLuis(host, { scope, onDone })` → `{ dispose }`; `preloadLuis()` (idempotent prefetch). Setup log, blackout, riff choreography (`SCORE`, `STRIKES`), settle, dialogue, final card. |
| `src/screens/debug.js` | The `from_luis.mp3` row (`data-act="luis"`) opens the `luis` view inside Debug Mode, so explorer state (patched puzzle, strip) survives. `show()` disposes the current `scene` (Sofi's intro or Luis); `preloadLuis()` runs on mount. |
| `src/styles.css` | `/* 3b · from_luis.mp3 */`: `.lz-*` rules, keyed on `.lz-stage[data-phase]` = `setup → dark → riff → calm → talking`. |
| `src/assets/luis-neutral.webp`, `luis-crazy.webp` | `speech-01.png` / `luis-crazy.png` resized to 640 px (Lanczos; the art has no clean pixel grid, so no `image-rendering: pixelated`). |
| `src/assets/luis-mouth.webp` | Open mouth: a feathered 200×150 crop of `speech-02.png` at (540, 690) of 1254, placed at `left 43.062% / top 55.024% / width 15.949%` over the neutral frame. The three source frames differ in noise everywhere, so a whole-frame mouth swap would shimmer; only this crop changes. |
| `src/assets/luis-bolt-1…4.webp` | `lightning-bolt.png` and the three connected components of `lighning-bolts.png`. Placed as `1l`, `1r` (mirrored), `2`, `3`, `4`. |
| `src/assets/luis-note.webp`, `luis-waves.webp` | Neon note (spawned per accent) and the sound-wave strip behind him. |
| `src/assets/luis-riff.mp3` | The riff excerpt (below). |
| `src/assets/luis-voice.mp3` | `sans-voice.mp3` as is. |

Source art and audio live untracked in `luis/` at the repo root; keep originals out of `src/`.

### Riff excerpt

`luis-riff.mp3` = `luis/epic-guitar-riff.mp3` **2.010–7.880 s** (5.87 s), 20 ms raised-cosine fade-in, fade-out 7.47 → 7.88 s (into the breath before the next phrase at 7.915 s), normalised to −1.5 dBFS peak (RMS ≈ −14.7 dBFS), mono 160 kbps. Musical landmarks (source time → seconds after the entry): pickup thump 2.03 s (−0.26), **entry 2.287 s (0)**, hardest transient 4.69 s (2.40), final chord 6.99 s (4.70), ghost notes 7.49/7.61 s. There is no steady tempo grid; `SCORE` is the list of measured transients. Re-cutting it: decode in a browser (no ffmpeg here), cut/fade/normalise in node, encode with `lamejs`, then re-measure the entry position in the decoded file and update `ATTACK_FALLBACK`.

### Playback lifecycle and sync

- `mountLuis` runs synchronously inside the tap on the row: it creates **one AudioContext** for riff and voice, calls `voice.prepare()` (resumes the context inside the gesture, decodes the voice) and decodes the riff from the prefetched bytes (`data.slice(0)`: `decodeAudioData` detaches its input and the bytes are memoised across replays).
- Setup: `SETUP` lines every 420 ms, blackout 520 ms after the last, then at least `HUM` (900 ms) in the dark. The first chord waits for sprites **and** riff (`LOAD_CAP` 9 s), then `begin()`.
- `begin()` schedules `source.start(now + 0.1)` and every visual from the audio clock: `attackMs = 0.1 s + attackIn(buffer) + outputLatency`. `attackIn` finds the steepest 20 ms rise within ±45 ms of `ATTACK_FALLBACK` (0.28 s: 25 ms decoder priming + 0.277 s of pickup), so decoder differences cannot shift the burst. `THUMP` (−0.257 s) twitches the flat line while still dark; `impact()` sets `data-phase="riff"` and fires strike 0; `SCORE` entries fire `chug` (headbang + wave pulse), `note` (neon note + pulse), `echo` (dim note) and `strike` (flash, bolt set from `STRIKES`, slam-bob, window `.shake`, two notes).
- No audio (context not running / decode failed): the same choreography runs on timers with `RIFF_SECONDS` (5.6 s).
- `source.onended` → `settle()`; a fallback timer at entry + riff length + 300 ms does the same. `settle()` is idempotent and makes `fire()` a no-op.

### Settle, cleanup and talking

- `calm`: crazy frame fades out over the neutral one (0.3 s), `lz-settle` squash, waves collapse (`lz-waves-out`), bolt/note/flash layers fade to 0 in 0.35 s; all `is-on` / `is-pulse` / bob classes are removed.
- 900 ms later `talking`: `.lz-bolts`, `.lz-notes`, `.lz-flash`, `.lz-waves`, `.lz-line` become `display: none`, the notes container is emptied, `.lz-text` appears and `dialogue.start(400)` runs. Effect animations deliberately have **no fill mode**: their base state is invisible, so nothing can be left on screen by a finished or cancelled animation. Keep it that way.
- Talking uses `createDialogue` from `dialogue.js` with `mouth: .lz-luis`: `.is-speaking` runs `lz-flap` (0.5 s irregular open/close) on `.lz-mouth`; the voice is `createSpeechAudio` over `luis-voice.mp3` at `VOICE_VOLUME` 0.42 (the clip is ~4 dB hotter than Sofi's). The engine maps it to one 0.9 s babble phrase (0.645–1.55 s) and chains it while letters type. A tap on the window body advances, as with Sofi.
- After the last line: `dialogue.quiet()` + 500 ms → the `ATTACHED TRACK` card (`.enter`) and `onDone`.

### Shared with Sofi / reuse

`dialogue.js` owns the bubble markup (`bubble(name)`), typewriter timing, pauses, voice start/stop and the `.is-speaking` mouth flag; `speechAudio.js` owns the voice. For another Luis appearance: render `bubble('LUIS')` inside an element that sets `--bubble: var(--neon)` (see `.lz-win`), reuse `luis-neutral.webp` + `luis-mouth.webp` with the `.lz-mouth` percentages and `lz-flap`, create the voice with `createSpeechAudio({ src: luis-voice.mp3, volume: 0.42 })`, call `prepare()` inside a gesture, and pass both to `createDialogue`. Don't fork the typewriter.

### Cleanup, navigation, replay

- `dispose()` stops the scene's own timers (a local set wrapping `scope.after`), stops the riff source, disposes the dialogue and the voice (which closes the AudioContext). `debug.js` calls it on view change and unmount; the `/vampireos` back button is available from the start.
- Opening the file again replays the full entrance (fresh mount, memoised assets).
- Regression risks: the `--bubble` variable (Sofi must stay pink: `var(--bubble, var(--pink))`); the shared `createDialogue` (any change affects the opening and the Debug intro); `data-phase` names used by CSS and JS; the mouth percentages if the sprites are regenerated; the attack window if the riff is re-cut.

### Verifying

`npm run build`, `npx vite preview`, set `localStorage['vampireos:screen'] = 'debug'` and open `/`, tap `from_luis.mp3` at 390 px. Check: four log lines, blackout with the flat line and a twitch on the thump, slam on the riff's entry, three strikes (entry, +2.4 s, +4.7 s), neutral face as the riff ends, **no bolts/notes/waves while he talks**, four lines verbatim with the mouth moving only on letters, the card at the end; back mid-riff stops the audio; reopening replays. Last automated run (headless Edge, instrumented `AudioBufferSourceNode.start`/`ended` and a MutationObserver): impact 336 ms after audible start (entry 275 ms + 40 ms latency), strikes at 0.00/2.38/4.70 s, settle at the exact `ended`, and during talking all effect layers `display: none`, 0 visible bolts, 0 notes, 0 effect animations.

### Known limitations

Same environment as Sofi (headless Chromium only; iOS Safari, the silent switch and real speakers untested). Boundaries, accent times and levels were measured, not listened to. The entrance replays on every open.
