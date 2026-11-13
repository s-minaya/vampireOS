# VampireOS — Project brief

**Status:** Narrative and Blackletter BIOS prototype approved; the guide characters, personal media and four-stage rollback refinements are also agreed. Implementation was authorized on November 12, 2026; integrate the refinements in small, reviewed passes. Remaining content decisions are listed below.
**Deadline:** November 15, 2026 (David's birthday).

## Purpose

A short, mobile-only birthday web experience for David, a backend developer who works with SAP ABAP/RAP. Its purpose is to make him laugh at shared jokes and end on a sincere note from Sofi and her partner. They have been friends for about a year, and David has become very important to them.

## Approved premise

Sofi, a frontend developer who often jokes that she understands none of David's backend work, has built him a gothic birthday "operating system". She meddled with its supposed backend and broke it. David must navigate a deliberately terrible interface and fix her embarrassingly simple bug to uncover his gift. **VampireOS is not sentient**: the bugs are Sofi's mistakes. The game *Pony Island* inspires the subversive interactions and feeling of investigating broken software, **not** the visual design or its story.

## Approved direction

- Aesthetic: dark, gothic, romantic, theatrical vampire atmosphere combined with fake retro operating-system UI, terminal windows, files and errors.
- Visual direction: **Blackletter BIOS**, as established in the approved Claude Design prototype (https://claude.ai/artifact/GpNSppTKQx3761d5X8ZW48). The prototype is the visual and interaction reference; do not redesign it.
  - Oxblood-black ground, bone text, one arterial red; hard pixel borders, pinstripe title bars, dither and scanlines.
  - One typeface per voice: pixel blackletter (Jacquard 24) for VampireOS's pomp, IM Fell English for its aristocratic speech, VT323 for the machine, Newsreader only for the letter.
  - Pink (the sprite's sweater) marks Sofi's comments, commits and name.
  - The rollback is a sunrise: black gothic, then **deliberately** grey unstyled HTML when the gothic theme is undone, then a white page. Make the loss of styling understandable as part of the story, not a broken build.
- Stack: Vite with vanilla JavaScript and self-hosted fonts (chosen during implementation).
- **System UI, technical logs and errors remain in English**, except **BARBARIDAD**, David's habitual catchphrase; `BARBARIDAD_EXCEPTION` is approved. **Sofi's and Luis's spoken/written character dialogue should ultimately be in Spanish**, in their authentic voices. For now, the provisional English lines below are implementation placeholders to be rewritten/reviewed by Sofi; do not silently translate or finalize them. The previously approved English ending lead-in is likewise retained provisionally until Sofi adapts it.
- VampireOS speaks in a formal, dramatic, aristocratic voice. Sofi is a chaotic, overconfident frontend developer who tries to guide David through her mistakes while blaming Luis when convenient; Luis is a musician, not a programmer.
- **Sofi's existing sprite appears as a short, occasional on-screen guide**, starting **before David presses any opening button**, then at confusion points. She must not give away the puzzle solution or interrupt every screen. Her final appearance is quieter and emotionally distinct. **Luis appears alongside Sofi during the CSS rollback as a second dialogue participant**, with his visual asset/presentation to be confirmed; do not invent what he looks like.
- The web is mobile-only, concise, single-user and primarily frontend/local-media driven. No genuine SAP integration, backend, account, payments or user-data collection.
- Use parody dark patterns for comedy, with harmless and completable interactions. No frustrating dead ends.
- Do not force all available media into the narrative. Prefer a few natural references over a collage.
- **Animations always play.** Do not honour `prefers-reduced-motion`: phones in power-saving mode may report it, and every animation, effect and visual detail must still run. Keep keyboard/screen-reader support where it does not change the approved interactions.

## Approved narrative beats (order)

1. **Mandatory Birthday Update — Sofi's first appearance (approved opening):**
   - A lightweight initial loader decodes only what is needed to show and wake Sofi (her sprites and the opening fonts); photos, audio and videos never block startup.
   - Sofi starts **asleep** with animated Zzz inside the `SYSTEM UPDATE` window, before any button exists. She wakes after **6 taps within 4 seconds**; each tap gives progressive visual feedback. After **2 seconds without a tap** she gradually falls asleep again and progress resets. Reuse the original 008-are-u-still-here poses/effects, adapted to this logic. **Tapping Sofi is the only way to wake her**: no alternative wake-up controls.
   - On success she plays the **startled** animation, then switches to **004-talking** and speaks the approved dialogue below in a mobile-friendly speech bubble with a typewriter effect, **synchronised with her talking animation and original talking sound**, including pauses between phrases; both stop when she finishes. The voice must sound fluid: no abrupt, frequent cuts or overlapping playback.
   - Immediately after her last line, she reacts with the original **009-i-see-you** expressions: **smirk → tease → giggle → smirk**. The reaction finishes before any button appears.
   - Only then are the choices revealed: first **`ACCEPT MY FATE`, red, with animated flashing lines** (the most obvious option), then **`I REFUSE` underneath, as a plain secondary key**. Sofi never tells David explicitly which button to press.
   - Both choices open `ARE YOU SURE?`. Cancelling returns to the available choices. Confirming refusal shows copy A, then **removes `I REFUSE`**, forcing acceptance. Confirming acceptance starts the existing update. Exact `ARE YOU SURE?` microcopy remains to be chosen.
2. **Failure — the confession:** The update reaches 99% and fails with `BARBARIDAD_EXCEPTION`, implying Sofi touched the backend. Restarting does not fix it. Sofi briefly admits she acted with misplaced confidence and points David toward Debug Mode, without solving anything.
3. **Debug Mode — personal files, Luis's song, then one code puzzle:** A fake file explorer includes these *approved* discoveries; keep navigation simple, with no additional puzzles:
   - **`from_luis.mp3` (early and prominent):** Luis's song appears near the start of Debug Mode with his brief note. David explicitly chooses `PLAY`; **no autoplay**. A small persistent play/pause control lets the track **continue through subsequent screens, including rollbacks and the letter**. The audio file and title are still to be supplied; use a marked placeholder meanwhile. If the fringe video plays, pause the song and restore its previous playing state afterwards (without unexpected overlapping audio).
   - **`identity.service`:** A **pixel-art Cloud Strife GIF**, *not the meme image*, accompanies a playful `CLOUD STRIFE (97%)` identity match and the **five Cloud traits** originally supplied as a reference: `quiet, brooding, secretly emotional`; `big “I'll handle it alone” energy`; `loyal once you break through`; `struggles with identity but keeps fighting`; `accidentally cool without trying`. Obtain/confirm a suitable GIF before adding it; the original meme is copy reference only.
   - **`facial_recognition.log`:** Show **one** of David's silly photos as an obviously unreliable facial-recognition result. Select from the real repository assets; do not turn it into a gallery.
   - **`emo_mode.mp4`:** Optional-to-open discovery presenting David's fringe video as an `UNAUTHORIZED HAIR ANIMATION`/visual anomaly. It is an approved part of Debug Mode, not a required step to unlock the gift.
   - **`ARCHITECTURE.txt` and `backend/please_work.js`:** Retain the approved absurd system-architecture copy and the **only** code puzzle. David reads the short `canOpenGift(date)` function, **types the fix** using the mobile keyboard and taps `RUN`. The two checks verify `14.11 → false` and `15.11 → true`; do not highlight the incorrect `false` or reveal the answer. Do not execute unrestricted user-entered JavaScript.
   Sofi may briefly welcome him to Debug Mode or point at the relevant *folder*, but she must not narrate every file or solve the puzzle for him.
4. **Missing gift → The Commit Crypt:** Once the puzzle is fixed, `/vampireos/gift` opens to an **empty folder**. **Remove the blinking cursor/false editable affordance.** Show an unobtrusive `0 files found` / previous versions clue and make `VERSION HISTORY` the natural next action. Sofi briefly explains that the gift should be there and that Git can recover older versions, without revealing the content of the lost file or why it disappeared.
   - **Git as premium:** David told Sofi that his workplace does not use version control. VampireOS proudly offers Git as a premium birthday feature; preserve approved signed note **I** (provisional English for future Spanish dialogue). Show a short, clear explanation that `ROLL BACK` moves to an earlier version and **does not start another puzzle**.
   - **Exactly four meaningful rollback interactions**, each with a visible narrative consequence, rather than six repetitive taps:
     1. **Undo David's fix:** `BARBARIDAD_EXCEPTION` returns, **because he is viewing the past**. Say so explicitly; he must not solve the code again.
     2. **Recover evidence of the deleted letter:** `birthday_letter.txt` returns to the historical working tree, but this broken version still cannot open it. Discover Sofi's embarrassment **gradually**, never explain it when the folder first appears.
     3. **Undo `add vampires`:** The gothic look/CSS deliberately vanishes. Explain it in-universe (`GOTHIC THEME REMOVED` / `gothic.css no longer exists`); **Sofi and Luis appear together and argue in the now-unstyled interface**. Sofi says `Luis broke the CSS.` Luis replies `I don't even know what CSS is. I made you a song.` This refers back to the song he already shared in Debug Mode, **not** a second song reveal. Keep their appearance brief and dialogue-first. The track can continue playing.
     4. **Return to the original commit:** Strip away the last unnecessary OS layer and reveal the original, **only bug-free** birthday letter and approved **INITIAL COMMIT** copy J. The player can now open the letter.
   - **Backstory:** Sofi first wrote a simple, working birthday message, then built an extravagant OS around it, broke things, and ultimately deleted the letter out of embarrassment. Git history preserved it; **she did not build VampireOS to hide the letter**. Use a few chaotic commit labels within these four narrative states; maintain a logical progression. The grey unstyled screen is an intentional rewind, not a rendering failure.
5. **Final scene — the recovered message:** After the original commit, the errors, manipulative UI and sarcastic guidance stop. Sofi's sprite appears in a **calmer, more prominent** presentation alongside the existing **provisional English opening**, to be adapted into Spanish by Sofi:

   > Okay, I might not understand what you do for a living. Or how your backend works. Or what RAP actually means.  
   > But there's one thing I'm absolutely sure of.

   Sofi's final personal message is not yet provided; **keep a clear placeholder**. A real photo of David, Sofi and Luis is planned; keep a placeholder until chosen. This scene is the **one part of VampireOS that works perfectly**: no new glitches, no joke that overshadows the sentiment. Luis's music remains available if David pressed play.

## Assets and media — approved vs pending

**Approved for inclusion, with original files still to be checked/selected where noted:**

- **Sofi's existing sprite:** guiding role in a few key scenes, plus a distinct final presentation. Reuse the actual current asset/frames only after inspection. Original spritesheet source: `C:\Users\tiaso\OneDrive\Escritorio\Proyectos\Ask Sofi\spritesheets\spritesheet`.
- **Luis's song:** early in Debug Mode, user-initiated playback and a persistent player for the rest of the experience. **Audio file, title and final brief note pending.** Do not assume the file is already in the repo.
- **Luis's visual appearance:** participates next to Sofi when CSS disappears. **Asset/representation pending**; use a clearly marked stand-in rather than inventing an appearance.
- **Cloud pixel-art GIF:** replaces display of the original meme. The meme is **reference material for the five traits**, not the asset to show. Select/confirm a fitting GIF and check usage permissions before public release.
- **One funny photo of David:** `facial_recognition.log`; choose from available photos without changing them into inaccurate representations.
- **Existing fringe video:** `emo_mode.mp4`, opened optionally from Debug Mode.
- **One real photo of David, Sofi and Luis:** final letter, file still to be selected/provided.

**Not included without new approval:** teenage emo photo gallery, general game-character screenshots, additional galleries, more media puzzles.

## Provisional character dialogue (English draft — later adapt to Spanish)

These lines establish **meaning and timing**, not final voice. **Only system/UI copy stays English.** Sofi will adapt both characters' dialogue and the letter lead-in into their natural Spanish before delivery. Do not over-explain or repeat every line in full on every appearance.

- **Sofi, opening (approved; provisional English until localised), one bubble per paragraph:**

  > Oh! David! You scared me!
  >
  > Right. Your birthday. I knew I was forgetting something.
  >
  > I made you a present. An entire operating system, actually.
  >
  > Now, a tiny warning: I designed the interface myself, and it may not have your best interests at heart.
  >
  > So... maybe don't trust the most obvious option.
- **Sofi, after the 99% crash:** `Right. So. I may have touched the backend. In my defense, I was feeling confident for absolutely no reason. You should probably open Debug Mode.`
- **Luis's note accompanying his song in Debug Mode:** `I have absolutely no idea how any of this works. So I did the one thing I actually know how to do. I made you a song. Hope you like it, mate.`
- **Sofi, if guidance is needed near the puzzle:** `The birthday logic is... not ideal. Can you fix it?` (No solution or line-number hint.)
- **Sofi, at the empty gift folder:** `This is awkward. Your gift should be here. It isn't. Good news: I included Git as a premium birthday feature. Try Version History. We might be able to recover something.`
- **Sofi, first rollback hint:** `Each rollback takes us back through one of my decisions. Please try not to judge me by the commit messages.`
- **Sofi, when the old bug resurfaces:** `You're not breaking it again. You're looking at an older version.`
- **CSS rollback dialogue — agreed English starting point:** `Sofi: "Luis broke the CSS."` / `Luis: "I don't even know what CSS is. I made you a song."` / optional Sofi: `...which is considerably more useful than whatever I was doing.`
- **Ending:** Preserve the opening in beat 5 as a placeholder pending Sofi's personal Spanish version and complete message.

## Copy & Easter Eggs

**Scope rule:** Preserve this creative copy bank, without turning every snippet into a compulsory scene. A and B were endorsed explicitly; C–H are selected copy candidates (not separate screens). I and J retain their approved English wording as reference; **I is dialogue signed by Sofi and may be localized into Spanish by her later**. Keep all system UI in English. The approved narrative and pacing take precedence over using every joke.

### Selected copy (A–J)

**A. Refusal response (approved verbatim)**

```text
Your objection has been carefully considered and discarded.
```

**B. Absurd architecture report (approved verbatim)**

```text
SYSTEM ARCHITECTURE

Frontend: React
Backend: Yes
Database: Probably
Security: Don't worry about it
SAP compatibility: Looks fine to me
```

`Frontend: React` is in-universe joke copy, **not** a requirement to use React.

**C. Initial diagnostic**

```text
> Initializing birthday protocol...
> ABAP runtime: detected
> Emotional availability: unknown
> Romantic vampire mode: enabled
> Frontend developer: confused
```

**D. Primary error**

```text
FATAL: BARBARIDAD_EXCEPTION

> Birthday patch installation failed.
> Root cause: Sofi touched the backend.
> Backend developer assistance required.
```

**E. Sofi's source-code comments**

```js
// TODO: Figure out what ABAP is.

// David does backend stuff.
// I do pretty buttons.
// This should be fine.
```

**F. Last modification log**

```text
Last modified by Sofi.
Tested in production.
Regrets: none.
```

**G. Trivially simple bug statistics**

```text
BUG FIXED

Difficulty: Trivial
Time wasted: Unnecessary
Developer responsible: Sofi
Developer confidence: Unreasonably high
```

**H. Post-fix message**

```text
Congratulations.

You have successfully fixed a bug
that should never have existed.

Sofi has been notified and has
chosen to ignore this incident.
```

**I. Git as a premium feature — Sofi's note (approved verbatim)**

```text
Don't panic, David. I know you're not used to seeing this at work.

For your birthday, I've included Git. You're welcome. — Sofi
```

**J. Original commit (approved verbatim)**

```text
INITIAL COMMIT
Author: Sofi
Files changed: 1
Bugs introduced: 0

Commit message:
"happy birthday, david"
```

### Optional one-liners (not selected for compulsory inclusion)

- Progress stuck at 99%: `Estimated time remaining: emotionally unavailable.`
- Hidden-code warning: `Please do not inspect the source code. Everything is perfectly fine.`
- Unauthorized patch warning: `You have modified production code without authorization. Sofi is very disappointed.`
- Fixed-backend response: `Backend fixed by an actual backend developer. Unexpected but appreciated.`
- Permanent dependency: `STATUS: David is now a permanent dependency. Removal is not supported.`
- Last popup: `VampireOS successfully installed. Unfortunately, Sofi remains your frontend developer.`

**Ending restraint:** Treat the final two one-liners as alternatives, not consecutive jokes. A sincere ending takes priority.

### Further ideas from the conversation for Claude to improvise with (unapproved)

These are **prompts for invention, not requirements**. Claude may ignore or adapt any of them, for example as commit messages, diffs or debug details:

- A suspicious file tree: `frontend/absolutely_perfect.ts`, `backend/what_is_rap.txt`, `secrets/DO_NOT_OPEN`, `definitely_not_a_birthday_letter.txt`; file names can act as clues rather than extra screens.
- The technical mismatch is the joke: `please_work.js` appearing in Sofi's supposed SAP/ABAP backend; do not pretend it is authentic ABAP code.
- Developer note: `I have absolutely no idea what SAP RAP is, but how hard can it be?`
- Faux API errors as optional joke fragments: `GET /david/emotions → 403 Forbidden`, `GET /david/drama → 200 OK`, `DELETE /david/emo-phase → 405 Method Not Allowed`.
- Cloud's pixel-art GIF, the five traits from the meme, and one silly portrait are now **approved** for the separate Debug Mode identity/facial-recognition views defined above. The original meme should **not** be displayed. Do not add a second gallery or forced mini-game.
- The best *Pony Island*-like surprise comes from discovering an unintended route through a broken UI or hidden file, **not** adding more minigames. Never simulate a real phone system alert or exfiltrate data.
- Potential flavor only: `BUILD 666`, birthday build `15.11.2026`, `BARBARIDAD DETECTED` / `BARBARIDAD RESOLVED`. Use sparingly to preserve the catchphrase's impact.

## Workflow & boundaries

- This birthday gift is an **explicit exception** to Sofi's usual SDD/TDD method: quick, focused vibe coding; no formal feature decomposition, extra documentation, test suite or unnecessary abstractions.
- Still manually check the full mobile journey, all controls and the ending. Reuse existing code/assets only after inspecting actual current files. No assumptions about an existing repository or design system.
- No deployment, paid services, purchases, commits or pushes without explicit approval.
- Implementation is authorized within the approved scope. **Apply the changes one small reviewed pass at a time** (see the order below); do not combine unrelated gameplay changes into a giant unreviewed rewrite. Unavailable media and personal messages stay as clearly identified placeholders.

## Creative autonomy, tools & efficiency

**Scope:** Creative and technical autonomy apply within the approved scope, now that implementation is authorized.

- **Creative freedom:** Within the approved premise, narrative order, tone and constraints, invent sharper English copy, optional jokes, subtle surprises, visual interactions, transitions and polish. Use the copy bank selectively; do not mechanically include everything. Favor a memorable, coherent, brief mobile experience over extra features.
- **Decision boundary:** Make small reversible implementation and presentation decisions independently. Propose any substantial change to approved behavior, story, media usage or project scope before applying it; do not silently settle items marked pending. If an asset is unavailable, use a clearly identified placeholder rather than inventing its contents.
- **Technical autonomy:** Inspect the actual project first, then choose the smallest maintainable frontend stack. During implementation, you may install **free, reputable, project-local** packages or development tools when they clearly save time or improve the result; reuse what exists and avoid unnecessary dependencies. Briefly identify important additions in the final summary. Ask before global/system changes, paid products, external accounts/services, purchases, deployment, commits, pushes, destructive actions or any action with real cost.
- **Keep token use lean:** Treat this file as the single source of truth; do not create parallel specs, task documents, repeated audits or agent teams. Read only relevant files and log excerpts. Prefer direct, focused edits, concise progress/output and one coherent implementation pass with targeted corrections. Use extra tools/plugins only when their benefit justifies context overhead; don't repeatedly research already-settled decisions.
- **Verification:** No automated test suite is requested. Still run the available build/check if one exists and manually inspect the complete mobile flow, puzzle, media and emotional ending. Report what was actually checked and any limitations.

## Implementation order (small reviewable passes)

These are **checkpoints for work in the current project**, not feature specs or extra documents. Do one at a time, show the result, and wait for Sofi's approval before moving to the next. Check the current repository and reuse existing UI/styles each time.

1. **Opening + guide:** Implement the approved opening in beat 1 (loader, sleeping Sofi, wake interaction, synchronised dialogue, choices and forced acceptance). Leave the exact confirmation microcopy as a placeholder until reviewed.
2. **Debug Mode discoveries + audio:** Add the early Luis song/player, Cloud GIF + five traits, one facial-recognition photo and the optional fringe-video viewer. Preserve the typed `RUN` puzzle; do not add puzzles. Check media continuity between screens.
3. **Empty gift + four rollbacks:** Remove the misleading cursor; make Version History/ROLL BACK self-explanatory; reduce to four causal states including restored letter and intentional CSS removal.
4. **Sofi and Luis together at CSS loss:** Add the short exchange as part of the third rollback, with a placeholder for Luis's visual if needed. **The song is already available**; do not present it as newly discovered here.
5. **Final content + language:** Insert the finished Spanish character dialogue, birthday message, the real photo and final selected media when supplied. Preserve system UI in English and the calm ending.
6. **Focused verification + delivery decision:** Check the complete journey on mobile (especially typing, playback, transitions, tap targets, and audio/video behavior) and run the available build. Obtain explicit approval before commits, pushes or deployment. Review public-repository exposure of personal assets before publishing.

## Pending decisions / assets

1. Exact `ARE YOU SURE?` microcopy (the opening flow, tap sequence and forced acceptance are approved).
2. Sofi/Luis's **final Spanish voice and dialogue**, including the existing signed Git note and the final letter introduction; final birthday message.
3. Luis's audio file/title and visual representation; suitable licensed/approved Cloud pixel-art GIF; final photo and selection of David's funny photo.
4. Publication/privacy choice and final technical/visual mobile checks; no deployment is authorized automatically.
