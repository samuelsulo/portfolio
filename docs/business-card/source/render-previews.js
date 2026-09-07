// Renders front.html / back.html to high-res PNG previews via headless
// Chromium, at true 300 DPI for the 91x61mm artboard.
const path = require('path');
const { chromium } = require('playwright');

const MM_PER_IN = 25.4;
const CSS_PX_PER_IN = 96;
const TARGET_DPI = 300;
const SCALE = TARGET_DPI / CSS_PX_PER_IN; // deviceScaleFactor

const WIDTH_MM = 91;
const HEIGHT_MM = 61;
const cssW = Math.round((WIDTH_MM / MM_PER_IN) * CSS_PX_PER_IN);
const cssH = Math.round((HEIGHT_MM / MM_PER_IN) * CSS_PX_PER_IN);

async function shoot(file, out, { guides = false } = {}) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: cssW, height: cssH },
    deviceScaleFactor: SCALE,
  });
  await page.goto('file://' + path.resolve(__dirname, file));
  await page.evaluate((g) => {
    document.body.style.background = 'transparent';
    if (g) {
      document.getElementById('guide-trim').hidden = false;
      document.getElementById('guide-safe').hidden = false;
    }
  }, guides);
  const card = page.locator('#card');
  await card.screenshot({ path: path.resolve(__dirname, out), omitBackground: false });
  await browser.close();
  console.log('wrote', out);
}

(async () => {
  const fs = require('fs');
  const outDir = path.resolve(__dirname, '../export');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await shoot('front.html', '../export/business-card-front-preview.png');
  await shoot('back.html', '../export/business-card-back-preview.png');
  // Guides variants (trim + safe-area overlay) are for QA only, not for print.
  await shoot('front.html', '../export/qa-front-guides.png', { guides: true });
  await shoot('back.html', '../export/qa-back-guides.png', { guides: true });
})();
