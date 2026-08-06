# Font subset sources

`Galmuri9.full.woff2` and `Galmuri14.full.woff2` are the original OFL webfonts kept outside `public/` so production builds do not ship them.

`npm run build` invokes `npm run fonts:subset` through `prebuild`. The generator scans user-visible text in `src/`, `index.html`, and `public/manifest.webmanifest`, keeps the normalized static codepoints, and writes deterministic WOFF2 subsets to `public/fonts/`. You can also run the subset command directly when reviewing font changes.

`Galmuri11.woff2` intentionally remains full in `public/fonts/`. It is the fallback for arbitrary Korean nicknames and imported user text that cannot be known at build time.
