/**
 * @file
 * Automated accessibility and keyboard checks for the demo site.
 *
 * Loads each key page state in Chromium, runs axe-core against WCAG 2.0,
 * 2.1 and 2.2 A/AA plus best-practice rules, checks keyboard behaviour, and
 * saves screenshots. Exits with code 1 if anything fails.
 *
 * Usage: BASE_URL=https://council-services.ddev.site npm run a11y
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:8888').replace(/\/$/, '');
const OUT = path.join(__dirname, 'screenshots');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`  FAIL ${message}`);
}

async function audit(page, name) {
  await page.addScriptTag({ content: AXE });
  const result = await page.evaluate((tags) => window.axe.run(document, { runOnly: tags }), TAGS);
  if (result.violations.length === 0) {
    console.log(`  ok   ${name}: 0 violations (${result.passes.length} rules passed)`);
  }
  result.violations.forEach((v) => {
    fail(`${name}: [${v.impact}] ${v.id} - ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
  });
}

async function search(page, postcode) {
  await page.fill('main .bin-day-form input[name="postcode"]', postcode);
  await page.click('main .bin-day-form input[type="submit"]');
  await page.waitForLoadState('networkidle');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );

  for (const [device, viewport] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    console.log(`\n${device} (${viewport.width}px)`);
    const page = await (await browser.newContext({ viewport })).newPage();

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await audit(page, 'home page');
    await page.screenshot({ path: `${OUT}/${device}-home.png`, fullPage: true });

    await page.keyboard.press('Tab');
    const firstStop = await page.evaluate(() => document.activeElement.textContent.trim());
    if (firstStop === 'Skip to main content') {
      console.log('  ok   first Tab stop is the skip link');
    }
    else {
      fail(`first Tab stop should be the skip link, got "${firstStop}"`);
    }

    await page.goto(`${BASE_URL}/bin-day`, { waitUntil: 'networkidle' });
    await audit(page, 'bin day form');

    await search(page, 's1 2hh');
    await audit(page, 'results');
    const focused = await page.evaluate(() => document.activeElement.id);
    if (focused === 'bin-day-results-title') {
      console.log('  ok   focus moves to the results heading');
    }
    else {
      fail(`focus should move to the results heading, got "#${focused}"`);
    }
    await page.screenshot({ path: `${OUT}/${device}-results.png`, fullPage: true });

    await search(page, 'Sheffield');
    await audit(page, 'validation error');
    await page.screenshot({ path: `${OUT}/${device}-error.png`, fullPage: true });

    await page.goto(`${BASE_URL}/user/login`, { waitUntil: 'networkidle' });
    await audit(page, 'page with sidebar block');
  }

  await browser.close();
  console.log(failures === 0 ? '\nAll accessibility checks passed.' : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
