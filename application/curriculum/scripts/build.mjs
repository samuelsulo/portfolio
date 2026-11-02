// Builds the curriculum PDFs (one per language) from samuelsulo-curriculum.json into public/curriculum.
// Colors come from brand/palette, fonts from brand/fonts and the Kitsune mark from brand/logo, so the
// curriculum follows the brand: change the palette or the content and rebuild.
//
//   npm run curriculum        (from application/)
//
// Set CHROME_PATH to an installed Chrome binary to skip the Chromium download, and
// CHROME_NO_SANDBOX=1 in containers.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const brand = path.resolve(root, '..', '..', 'brand')
const data = JSON.parse(fs.readFileSync(path.join(root, 'samuelsulo-curriculum.json'), 'utf8'))
const palette = JSON.parse(
  fs.readFileSync(path.join(brand, 'palette', 'samuelsulo-palette.json'), 'utf8'),
).colors

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const dataUri = (file, mime) => `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`
const hex = (token) => {
  if (!palette[token]) throw new Error(`The palette has no color "${token}"`)
  return palette[token].hex
}
const rgba = (token, alpha) => {
  const h = hex(token).slice(1)
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return `rgba(${r},${g},${b},${alpha})`
}

// A color over the white page as an opaque color: a semi-transparent border or background on a rounded box makes
// Chrome rasterize it into the PDF, which triples its size.
const solid = (token, alpha) => {
  const h = hex(token).slice(1)
  const mixed = [0, 2, 4].map((i) =>
    Math.round(255 + (parseInt(h.slice(i, i + 2), 16) - 255) * alpha),
  )
  return '#' + mixed.map((v) => v.toString(16).padStart(2, '0')).join('')
}

const photo = dataUri(path.join(root, 'assets', 'photo.jpg'), 'image/jpeg')
const mark = dataUri(
  path.join(brand, 'logo', 'export', 'svg', 'samuelsulo-symbol-negative.svg'),
  'image/svg+xml',
)
const font = (family, weight, file) =>
  `@font-face{font-family:'${family}';font-weight:${weight};src:url('${dataUri(path.join(brand, 'fonts', file), 'font/ttf')}') format('truetype')}`

const css = `
${font('Space Grotesk', 400, 'Space-Grotesk-400.ttf')}${font('Space Grotesk', 500, 'Space-Grotesk-500.ttf')}${font('Space Grotesk', 700, 'Space-Grotesk-700.ttf')}
${font('JetBrains Mono', 400, 'Jetbrains-Mono-400.ttf')}${font('JetBrains Mono', 500, 'Jetbrains-Mono-500.ttf')}${font('JetBrains Mono', 700, 'Jetbrains-Mono-700.ttf')}
@page { size: A4; margin: 0 }
:root { --void:${hex('void')}; --snow:${hex('snow')}; --slate:${hex('slate')}; --cyan:${hex('neon-cyan')}; --cyan-l:${hex('neon-cyan-light')}; --violet:${hex('neon-violet')}; --deep:${hex('deep-cyan')}; --deep-v:${hex('deep-violet')}; --ink:${hex('ink')}; --ink-s:${hex('ink-soft')}; --ink-f:${hex('ink-faint')} }
* { box-sizing: border-box; margin: 0; padding: 0 }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact }
body { font-family: 'Space Grotesk', sans-serif; color: var(--ink); font-size: 8.9pt; line-height: 1.42 }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; display: flex; background: #fff; page-break-after: always }
.page:last-child { page-break-after: auto }
.side { position: relative; width: 70mm; flex: none; background: var(--void); color: var(--snow); padding: 14mm 8mm 12mm; overflow: hidden }
.side::before { content:''; position:absolute; inset:0; background-image: linear-gradient(160deg, var(--void) 10%, ${rgba('void', 0)} 80%), linear-gradient(${rgba('neon-cyan', 0.07)} .12mm, transparent .12mm), linear-gradient(90deg, ${rgba('neon-cyan', 0.07)} .12mm, transparent .12mm); background-size: 100% 100%, 6mm 6mm, 6mm 6mm }
.side::after { content:''; position:absolute; width:90mm; height:90mm; right:-55mm; top:-40mm; border-radius:50%; background: radial-gradient(circle, ${rgba('neon-violet', 0.38)}, transparent 65%) }
.side > * { position: relative; z-index: 1 }
.photo { width: 46mm; height: 46mm; margin: 0 auto 9mm; border-radius: 50%; border: .5mm solid var(--cyan); box-shadow: 0 0 0 1mm ${rgba('neon-cyan', 0.18)}, 0 0 7mm ${rgba('neon-cyan', 0.35)}; overflow: hidden }
.photo img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 8%; display: block }
.s-title { font-family: 'JetBrains Mono'; font-size: 6.8pt; letter-spacing: .18em; text-transform: uppercase; color: var(--cyan); margin: 7mm 0 2.6mm; display: flex; align-items: center; gap: 2mm }
.s-title::after { content:''; flex: 1; height: .2mm; background: linear-gradient(90deg, ${rgba('neon-cyan', 0.5)}, transparent) }
.s-title:first-of-type { margin-top: 0 }
.contact { list-style: none; font-family: 'JetBrains Mono'; font-size: 7.2pt; color: var(--snow) }
.contact li { margin-bottom: 2.1mm; word-break: break-all; line-height: 1.3 }
.contact span { display: block; color: var(--slate); font-size: 6pt; letter-spacing: .14em; text-transform: uppercase }
.contact a { color: inherit; text-decoration: none }
.sk { margin-bottom: 3.4mm }
.sk h4 { font-weight: 500; font-size: 8pt; color: var(--cyan-l); margin-bottom: 1.2mm }
.sk ul { list-style: none }
.sk li { font-size: 8pt; color: var(--snow); padding-left: 3mm; position: relative; margin-bottom: .7mm; line-height: 1.35 }
.sk li::before { content:''; position: absolute; left: 0; top: 1.5mm; width: 1.2mm; height: 1.2mm; border-radius: 50%; background: var(--violet) }
.langs, .certs { list-style: none; font-size: 8.4pt }
.langs li { display: flex; justify-content: space-between; border-bottom: .2mm solid ${rgba('snow', 0.1)}; padding: 1.3mm 0 }
.langs li span { color: var(--slate); font-family: 'JetBrains Mono'; font-size: 7pt }
.certs li { margin-bottom: 3.4mm }
.certs b { display: block; font-weight: 500; color: var(--snow); font-size: 8.4pt; line-height: 1.3 }
.certs i { font-style: normal; font-family: 'JetBrains Mono'; font-size: 6.6pt; color: var(--slate); display: block; margin-top: .6mm; word-break: break-all }
.ghost { position: absolute !important; left: 10mm; bottom: -12mm; width: 66mm; opacity: .14; z-index: 0 !important }
.main { flex: 1; padding: 13mm 13mm 11mm 12mm; position: relative }
.head { position: relative; padding-bottom: 5mm; border-bottom: .3mm solid ${solid('ink-faint', 0.25)}; margin-bottom: 5mm }
.head h1 { font-size: 30pt; line-height: 1; font-weight: 700; letter-spacing: -.01em; color: var(--void) }
.role { display: flex; align-items: center; gap: 2.4mm; margin-top: 3mm; font-family: 'JetBrains Mono'; font-size: 8.4pt; letter-spacing: .12em; text-transform: uppercase; color: var(--deep); font-weight: 500 }
.role::before { content:''; width: .8mm; height: 4mm; border-radius: 1mm; background: linear-gradient(var(--cyan), var(--violet)) }
.head img { position: absolute; right: 0; top: 0; width: 14mm; height: 14mm; padding: 1.6mm; border-radius: 3mm; background: var(--void) }
.sec { margin-bottom: 5mm }
.h2 { font-family: 'JetBrains Mono'; font-size: 7.4pt; letter-spacing: .18em; text-transform: uppercase; color: var(--deep); font-weight: 700; margin-bottom: 3mm; display: flex; align-items: center; gap: 2.4mm }
.h2::after { content:''; flex: 1; height: .25mm; background: linear-gradient(90deg, var(--cyan), var(--violet), transparent) }
.about { font-size: 9.2pt; color: var(--ink-s); line-height: 1.5 }
.job { position: relative; padding-left: 5mm; margin-bottom: 4.6mm; border-left: .3mm solid ${solid('ink-faint', 0.3)}; margin-left: 1mm }
.job::before { content:''; position: absolute; left: -1.25mm; top: 1.1mm; width: 2.2mm; height: 2.2mm; border-radius: 50%; background: #fff; border: .5mm solid var(--deep); box-shadow: 0 0 0 .6mm ${rgba('neon-cyan', 0.25)} }
.job-top { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm }
.job h3 { font-size: 10.6pt; font-weight: 700; color: var(--void); line-height: 1.25 }
.when { font-family: 'JetBrains Mono'; font-size: 7pt; color: var(--deep); white-space: nowrap; font-weight: 500 }
.sub { font-size: 8.6pt; color: var(--ink-f); margin: .5mm 0 1.6mm }
.sub b { color: var(--deep-v); font-weight: 500 }
.job p.intro { font-size: 8.8pt; color: var(--ink-s); margin-bottom: 1mm }
.job ul { list-style: none }
.job li { position: relative; padding-left: 3.6mm; margin-bottom: 1.25mm; font-size: 8.8pt; color: var(--ink-s) }
.job li::before { content:''; position: absolute; left: .2mm; top: 1.65mm; width: 1.3mm; height: 1.3mm; background: var(--cyan); border-radius: .3mm; transform: rotate(45deg); box-shadow: 0 0 0 .3mm ${rgba('deep-cyan', 0.35)} }
.proj { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm }
.pc { border: .25mm solid ${solid('ink-faint', 0.3)}; border-radius: 2mm; padding: 3mm 3.4mm; background: linear-gradient(160deg, #fff, ${solid('mist', 0.6)}) }
.pc h3 { font-size: 9.6pt; font-weight: 700; color: var(--void); display: flex; align-items: center; gap: 2mm; line-height: 1.2 }
.pc h3 em { font-style: normal; font-family: 'JetBrains Mono'; font-size: 5.8pt; letter-spacing: .12em; text-transform: uppercase; color: var(--deep-v); border: .2mm solid ${solid('deep-violet', 0.45)}; border-radius: 1mm; padding: .2mm 1mm; font-weight: 500 }
.pc a { display: block; font-family: 'JetBrains Mono'; font-size: 6.8pt; color: var(--deep); text-decoration: none; margin: .8mm 0 1.4mm }
.pc p { font-size: 8.2pt; color: var(--ink-s); line-height: 1.4 }
`

function render(lang) {
  const t = data[lang]
  const l = t.labels
  const c = data.contact
  const link = (u) => `<a href="https://${u}">${esc(u)}</a>`
  const to = (v) => (v === 'present' || v === 'presente' ? l.present : v)
  const skills = t.skills
    .map(
      (g) =>
        `<div class="sk"><h4>${esc(g.title)}</h4><ul>${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`,
    )
    .join('')
  const job = (
    j,
  ) => `<div class="job"><div class="job-top"><h3>${esc(j.title)}</h3><span class="when">${esc(j.from)} - ${esc(to(j.to))}</span></div>
    <div class="sub"><b>${esc(j.company)}</b>${j.location ? ' · ' + esc(j.location) : ''}</div>
    ${j.intro ? `<p class="intro">${esc(j.intro)}</p>` : ''}<ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>`
  const edu = (
    e,
  ) => `<div class="job"><div class="job-top"><h3>${esc(e.title)}</h3><span class="when">${esc(e.from)} - ${esc(to(e.to))}</span></div>
    <div class="sub"><b>${esc(e.school)}</b> · ${esc(e.location)}</div>${e.bullets.length ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</div>`
  const projects = t.projects
    .map(
      (x) =>
        `<div class="pc"><h3>${esc(x.name)}<em>${esc(x.tag)}</em></h3><a href="https://${x.url}">${esc(x.url)}</a><p>${esc(x.text)}</p></div>`,
    )
    .join('')
  const certs = t.certifications
    .map(
      (x) =>
        `<li><b>${esc(x.name)}</b><i><a href="https://www.${x.url}" style="color:inherit;text-decoration:none">${esc(x.url)}</a></i></li>`,
    )
    .join('')
  const langs = t.languages.map(([a, b]) => `<li>${esc(a)}<span>${esc(b)}</span></li>`).join('')
  const location = lang === 'it' ? c.locationIt || c.location : c.location
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(data.name)} - ${esc(t.title)}</title><style>${css}</style></head><body>
  <section class="page">
    <aside class="side">
      <div class="photo"><img src="${photo}" alt=""></div>
      <div class="s-title">${esc(l.contact)}</div>
      <ul class="contact">
        <li><span>Web</span>${link(c.web)}</li><li><span>Email</span><a href="mailto:${c.email}">${esc(c.email)}</a></li>
        <li><span>LinkedIn</span>${link(c.linkedin)}</li><li><span>GitHub</span>${link(c.github)}</li><li><span>${esc(l.basedIn)}</span>${esc(location)}</li>
      </ul>
      <div class="s-title">${esc(l.skills)}</div>${skills}
      <img class="ghost" src="${mark}" alt="">
    </aside>
    <main class="main">
      <header class="head"><h1>${esc(data.name)}</h1><div class="role">${esc(t.role)}</div><img src="${mark}" alt=""></header>
      <section class="sec"><h2 class="h2">${esc(l.about)}</h2><p class="about">${esc(t.about)}</p></section>
      <section class="sec"><h2 class="h2">${esc(l.experience)}</h2>${t.experience.slice(0, 2).map(job).join('')}</section>
    </main>
  </section>
  <section class="page">
    <aside class="side">
      <div class="s-title">${esc(l.certifications)}</div><ul class="certs">${certs}</ul>
      <div class="s-title">${esc(l.languages)}</div><ul class="langs">${langs}</ul>
      <img class="ghost" src="${mark}" alt="">
    </aside>
    <main class="main">
      <section class="sec"><h2 class="h2">${esc(l.experience)}</h2>${t.experience.slice(2).map(job).join('')}</section>
      <section class="sec"><h2 class="h2">${esc(l.projects)}</h2><div class="proj">${projects}</div></section>
      <section class="sec"><h2 class="h2">${esc(l.education)}</h2>${t.education.map(edu).join('')}</section>
    </main>
  </section></body></html>`
}

const out = path.resolve(root, '..', 'public', 'curriculum')
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: process.env.CHROME_NO_SANDBOX ? ['--no-sandbox'] : [],
})
for (const lang of Object.keys(data).filter((k) => data[k] && data[k].labels)) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'curriculum-'))
  try {
    fs.writeFileSync(path.join(tmp, 'curriculum.html'), render(lang))
    const page = await browser.newPage()
    await page.goto('file://' + path.join(tmp, 'curriculum.html'))
    await page.evaluate(() => document.fonts.ready)
    const file = path.join(out, `samuelsulo-curriculum-${lang}.pdf`)
    await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true })
    await page.close()
    console.log(`written ${path.relative(process.cwd(), file)}`)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}
await browser.close()
