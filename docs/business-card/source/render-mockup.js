// Renders mockup.html (front + back side by side) to a presentation PNG.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const outDir = path.resolve(__dirname, '../export');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 400 }, deviceScaleFactor: 2.5 });
  await page.goto('file://' + path.resolve(__dirname, 'mockup.html'));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, 'business-card-mockup.png') });
  await browser.close();
  console.log('wrote business-card-mockup.png');
})();
