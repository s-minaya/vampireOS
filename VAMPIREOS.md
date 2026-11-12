# VampireOS — Project brief

**Status:** Narrative approved, including beat 4. Remaining open items are listed under *Pending decisions*. No implementation is authorized yet.
**Deadline:** November 15, 2026 (David's birthday).

## Purpose

A short, mobile-only birthday web experience for David, a backend developer who works with SAP ABAP/RAP. Its purpose is to make him laugh at shared jokes and end on a sincere note from Sofi and her partner. They have been friends for about a year, and David has become very important to them.

## Approved premise

Sofi, a frontend developer who often jokes that she understands none of David's backend work, has built him a gothic birthday "operating system". She meddled with its supposed backend and broke it. David must navigate a deliberately terrible interface and fix her embarrassingly simple bug to uncover his gift. **VampireOS is not sentient**: the bugs are Sofi's mistakes. The game *Pony Island* inspires the subversive interactions and feeling of investigating broken software, **not** the visual design or its story.

## Approved direction

- Aesthetic: dark, gothic, romantic, theatrical vampire atmosphere combined with fake retro operating-system UI, terminal windows, files and errors. No final visual design or palette approved yet.
- All visible UI/copy in **English**, except **BARBARIDAD**, David's habitual catchphrase, used as a recurring error term; `BARBARIDAD_EXCEPTION` is approved.
- VampireOS speaks in a formal, dramatic, aristocratic voice. Sofi's overconfident, technically dubious voice is revealed through code comments, debug logs and hidden files.
- Sofi does **not** appear as an on-screen support character during the game. Her existing sprite appears **only at the emotional ending**, beside the approved lead-in text.
- The web is mobile-only, concise, single-user and primarily frontend/local-media driven. No genuine SAP integration, backend, account, payments or user-data collection.
- Use parody dark patterns for comedy, with harmless and completable interactions. No frustrating dead ends.
- Do not force all available media into the narrative. Prefer a few natural references over a collage.

## Approved narrative beats (order)

1. **Mandatory Birthday Update:** David sees `ACCEPT MY FATE` and `I REFUSE`. `I REFUSE` exists only to exasperate him and must eventually **force him to tap `ACCEPT MY FATE`**. Both initial choices trigger an extra `ARE YOU SURE?` confirmation before installation. If David chooses `I REFUSE`, the flow must eventually return him to `ACCEPT MY FATE`—refusal cannot start installation on its own or offer a real escape. Exact confirmation wording and tap sequences remain undecided.
2. **Failure:** the update reaches 99% and fails, showing `BARBARIDAD_EXCEPTION` and implying that Sofi touched the backend. Repeating/restarting does not fix the failure; David can enter debug mode.
3. **Debug tools + trivial code puzzle:** David explores a fake filesystem, discovers Sofi's questionable comments, and fixes an absurdly simple `false` → `true` return/condition (a `please_work.js` file is the working concept). Mobile-friendly taps, not typing actual code. There must be **only one** code puzzle, intentionally easy for him.
4. **Exploration after the fix — The Commit Crypt:** After the `false` → `true` fix, David finds an **empty gift folder**, explores Sofi's commit history, and rolls back through earlier versions. The gothic interface progressively disappears until the original, perfectly working birthday message is revealed.
   - **Backstory, discovered gradually through the commits:** Sofi first wrote a simple, working birthday message, then tried to build an elaborate operating system around it, broke everything, and eventually deleted the letter out of embarrassment. Git history preserved it. She did **not** build VampireOS to hide the letter.
   - Do not reveal the deletion or its reason upfront; the empty folder must not explain itself.
   - **Git as a premium birthday feature:** David has told Sofi that his workplace doesn't use version control. VampireOS proudly presents Git as a premium birthday feature, with Sofi's signed note (copy I) shown as text only, no sprite.
   - **Commit history:** a few absurd commit messages reflecting Sofi's chaotic development process, without distracting from the narrative. Exact messages and the number of rollback states are implementation details.
   - **Original commit:** reveals copy J. It is the only bug-free version, because Sofi originally just wanted to write David a birthday message.
5. **Final scene — the recovered message:** the rollback ends at Sofi's original commit, which opens into her birthday message; the errors and manipulative UI have given way to it. The first appearance of Sofi's sprite accompanies the **approved English opening**:

   > Okay, I might not understand what you do for a living. Or how your backend works. Or what RAP actually means.  
   > But there's one thing I'm absolutely sure of.

   The final message is being prepared by Sofi; use a placeholder until she supplies it. A real photo of David, Sofi and her partner is planned for the ending. The emotional reveal should feel like the **one part of VampireOS that works perfectly**; do not bury it under further glitches or jokes.

## Optional media (not approved for inclusion)

- A meme in which Sofi compares David to Cloud Strife: possible mistaken-identity bug.
- Funny photos of David: possible facial-recognition bug.
- Video of David's emo fringe: possible appearance/configuration bug.
- Photos of their teenage emo years; game-character screenshots: no coherent use approved; exclude unless a genuinely good idea emerges.
- Existing Sofi spritesheets: inspect the real assets before choosing animations or integration. Repo at: "C:\Users\tiaso\OneDrive\Escritorio\Proyectos\Ask Sofi\spritesheets\spritesheet"

## Copy & Easter Eggs

**Scope rule:** Preserve the text below as a creative copy bank. Do **not** turn every snippet into a required screen, obstacle or feature. Keep the approved narrative and mobile pacing more important than fitting in every joke. A and B were explicitly endorsed; C–H were subsequently accepted as **selected copy candidates** (especially E–H as alternatives for the debug sequence, **not** four separate scenes). I and J are approved verbatim for beat 4. Final placement and exact use remain flexible unless identified as a fixed requirement elsewhere.

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
- The optional Cloud Strife meme could surface as a misidentified user profile, and David's silly portraits as an obviously broken facial-recognition module—only if they feel organic.
- The best *Pony Island*-like surprise comes from discovering an unintended route through a broken UI or hidden file, **not** adding more minigames. Never simulate a real phone system alert or exfiltrate data.
- Potential flavor only: `BUILD 666`, birthday build `15.11.2026`, `BARBARIDAD DETECTED` / `BARBARIDAD RESOLVED`. Use sparingly to preserve the catchphrase's impact.

## Workflow & boundaries

- This birthday gift is an **explicit exception** to Sofi's usual SDD/TDD method: quick, focused vibe coding; no formal feature decomposition, extra documentation, test suite or unnecessary abstractions.
- Still manually check the full mobile journey, all controls and the ending. Reuse existing code/assets only after inspecting actual current files. No assumptions about an existing repository or design system.
- No deployment, paid services, purchases, commits or pushes without explicit approval.
- Beat 4 is decided. Implementation starts only when Sofi explicitly gives the go-ahead.

## Creative autonomy, tools & efficiency

**Scope:** Creative freedom applies to proposals now. Technical changes and installations are authorized **only during implementation, once Sofi explicitly gives the go-ahead**; until then the project remains read-only.

- **Creative freedom:** Within the approved premise, narrative order, tone and constraints, invent sharper English copy, optional jokes, subtle surprises, visual interactions, transitions and polish. Use the copy bank selectively; do not mechanically include everything. Favor a memorable, coherent, brief mobile experience over extra features.
- **Decision boundary:** Make small reversible implementation and presentation decisions independently. Propose any substantial change to approved behavior, story, media usage or project scope before applying it; do not silently settle items marked pending. If an asset is unavailable, use a clearly identified placeholder rather than inventing its contents.
- **Technical autonomy:** Inspect the actual project first, then choose the smallest maintainable frontend stack. During implementation, you may install **free, reputable, project-local** packages or development tools when they clearly save time or improve the result; reuse what exists and avoid unnecessary dependencies. Briefly identify important additions in the final summary. Ask before global/system changes, paid products, external accounts/services, purchases, deployment, commits, pushes, destructive actions or any action with real cost.
- **Keep token use lean:** Treat this file as the single source of truth; do not create parallel specs, task documents, repeated audits or agent teams. Read only relevant files and log excerpts. Prefer direct, focused edits, concise progress/output and one coherent implementation pass with targeted corrections. Use extra tools/plugins only when their benefit justifies context overhead; don't repeatedly research already-settled decisions.
- **Verification:** No automated test suite is requested. Still run the available build/check if one exists and manually inspect the complete mobile flow, puzzle, media and emotional ending. Report what was actually checked and any limitations.

## Pending decisions

1. The exact "Are you sure?" / refusal microinteraction and copy (keep the approved forced-accept behavior).
2. Final personal message and media selections/availability.
3. Concrete visual design and implementation stack after reviewing current source/assets.
