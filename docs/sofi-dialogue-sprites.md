# Sofi: sprites, dialogue and voice — technical handoff

Narrative and approved behaviour live in `VAMPIREOS.md` (beat 1). This file only covers how the opening is built, so future changes don't break it.

## Files

| File | Responsibility |
|---|---|
| `src/screens/opening.js` | Sofi scene in the update window: wake interaction, typewriter dialogue, 009 reaction. `mountOpening(host, { scope, onWake, onDone })` returns `{ dispose }`. |
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
3. **Dialogue.** There is one bubble per entry in `LINES`; the text is approved, so don't edit it here. `playPage()` puts the full line in a hidden ghost span to reserve the bubble's final size, then reveals one character per tick (`TYPE` delays: letters, `,;` short pause, `.…:?!` long pause). The speaking flag follows the SofiSpeech rule: on for letters, off at punctuation and at the end, unchanged for spaces. A tap while typing completes the line; a tap on a finished line goes to the next one. Otherwise lines advance automatically after `READ(text)`.
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
