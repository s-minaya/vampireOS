# VampireOS

A mobile-only birthday experience for David. The brief and every approved decision live in [VAMPIREOS.md](VAMPIREOS.md).

## Run it

```bash
npm install
npm run dev      # local server, also reachable from a phone on the same Wi-Fi
npm run build    # production build in dist/
npm run preview  # serve the production build
```

## Before sending it

- Fill in the final message and photo in [src/content.js](src/content.js). Until then the ending shows marked placeholders.
- The `ARE YOU SURE?` dialog still shows `[ confirmation copy pending ]` (see *Pending decisions* in the brief).

## Good to know

- Reloading resumes the current chapter. Add `?restart` to the URL to start again from the update screen.
- The page is drawn 390px wide and every phone scales it to its own width.
