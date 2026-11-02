# Curriculum

The curriculum of Samuel Sulo, in Italian and English, as two A4 PDFs of two pages. It is an extension of
the brand: the dark side column with the grid and the glow, the neon accents, Space Grotesk and
JetBrains Mono, the Kitsune mark and the portrait of the portfolio.

The content is a single file, [`samuelsulo-curriculum.json`](./samuelsulo-curriculum.json), with the shared
data (name, contacts) and one block per language (`it`, `en`) that holds every text: profile, skills,
experience, projects, education, languages and certifications. Every file in `export/` is generated from it,
so change the content and rebuild instead of editing the PDFs. Colors come from the
[palette](../palette/README.md) and fonts from [`../fonts/`](../fonts).

## Rebuild

```
npm ci --prefix brand/curriculum
node brand/curriculum/scripts/build.mjs
```

Set `CHROME_PATH` to an installed Chrome binary to skip the Chromium download, and `CHROME_NO_SANDBOX=1`
in containers. The first two experiences are on page 1 and the rest on page 2: if a text grows, check
that nothing is cut at the bottom of the page.

## Publishing

The site serves the two PDFs from `application/public/curriculum/` and links the one that matches the language
of the visitor. After a rebuild, copy the files in `export/` there and release the application.

## Index

| File | Description |
|---|---|
| `samuelsulo-curriculum.json` | The content, the single source of truth |
| `assets/` | The portrait (`photo.jpg`, the site portrait flattened on the dark backdrop of the photo circle, to keep the PDFs light) and the Kitsune mark (from `../logo/export/svg/`) |
| `scripts/build.mjs` | Renders the PDFs |
| `export/samuelsulo-curriculum-it.pdf`, `-en.pdf` | The curriculum, one per language |
