# VampireOS — Claude Code instructions

- Before changing Sofi's sprites, dialogue or talking audio, read `docs/sofi-dialogue-sprites.md` (technical handoff; narrative decisions stay in `VAMPIREOS.md`).
- Read `VAMPIREOS.md` at the start of the project. Treat it as the single source of truth; revisit relevant sections when needed, without duplicating it here.
- Keep responses concise, not reasoning or implementation. For important creative or technical decisions, explain alternatives and trade-offs briefly. Never sacrifice quality, correctness, or necessary verification to save tokens. Report results, blockers, and checks without lengthy narration or full file dumps unless requested.
- For each task, inspect only the relevant current files and assets. Reuse existing code, avoid repeated reads, and keep shell/log output focused.
- Make routine creative and technical decisions autonomously within the approved brief. Ask before changing approved decisions or adding major scope.
- Prefer the simplest maintainable solution. No unnecessary abstractions, additional documentation, formal feature plans, or automated test suite for this gift. Still check that the build works and manually verify the mobile journey.
- You may add useful free, local dependencies; avoid unnecessary tools, MCPs, plugins, and agent teams. Do not incur charges, use paid services, deploy, commit, push, or perform destructive actions without explicit approval.
- When compacting, preserve approved decisions, current files and changes, outstanding blockers, and next steps; discard verbose logs and abandoned ideas.
