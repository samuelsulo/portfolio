# CV

The CV of Samuel Sulo, in Italian and English, as two A4 PDFs of two pages. It is an extension of
the brand: the dark side column with the grid and the glow, the neon accents, Space Grotesk and
JetBrains Mono, the Kitsune mark and the portrait of the portfolio.

The content is a single file, [`samuelsulo-cv.json`](./samuelsulo-cv.json), with the shared
data (name, contacts) and one block per language (`it`, `en`) that holds every text: profile, skills,
experience, projects, education, languages and certifications. The PDFs in
[`../public/cv/`](../public/cv) are generated from it, so change the content and rebuild
instead of editing them. Colors come from [`brand/palette`](../../brand/palette), fonts from
[`brand/fonts`](../../brand/fonts) and the mark from [`brand/logo`](../../brand/logo).

## Rebuild

From `application/`:

```
npm ci
npm run cv
```

Set `CHROME_PATH` to an installed Chrome binary to skip the Chromium download (otherwise run
`npx playwright install chromium` once), and `CHROME_NO_SANDBOX=1` in containers. The first two
experiences are on page 1 and the rest on page 2: if a text grows, check that nothing is cut at the
bottom of the page. Then deploy the content with `npm run deploy:content`, no application release is needed: the site links
the PDF that matches the language of the visitor (`cvUrl` in `public/content/data/site-config.json`).

## Index

| File | Description |
|---|---|
| `samuelsulo-cv.json` | The content, the single source of truth |
| `assets/photo.jpg` | The portrait of the site, flattened on the dark backdrop of the photo circle to keep the PDFs light |
| `scripts/build.mjs` | Renders the PDFs into `public/cv/` |
