# CEMFI Banking & Finance Seminars

Static site for the CEMFI Banking & Finance seminar archive + booking calendar.

Served via GitHub Pages at <https://cemfi-bf.github.io> (`index.html` at repo root).

## Layout

- `index.html`, `styles.css`, `app.js`, `history-archive.js` — static site (root)
- `logo/`, `photos/` — site assets
- `data/` — source `cemfi_banking_seminars.{csv,json}` and `cemfi_phd_workshops.{csv,json}`
- `scripts/build-history-archive.mjs` — regenerates `history-archive.js`
- `tests/` — `bf-calendar.test.mjs`, `bf-nav.test.mjs` (jsdom smoke tests)

## Regenerate the archive

```bash
```bash
npm install
npm test
