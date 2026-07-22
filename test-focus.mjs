import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:1420');
  await page.waitForTimeout(1000);

  // click focus mode button
  const shrinkBtn = page.locator('button:has(svg.lucide-maximize)'); // not in focus mode initially
  if (await shrinkBtn.isVisible()) {
    await shrinkBtn.click();
    console.log("Clicked to enter focus mode");
  } else {
    console.log("Maximize button not found");
  }

  await page.waitForTimeout(500);

  // visualizer button should be visible
  const visBtn = page.locator('button:has(svg.lucide-activity)');
  if (await visBtn.isVisible()) {
    console.log("Visualizer button is visible in focus mode");
    await visBtn.click();
    console.log("Clicked to show visualizer");
  } else {
    console.log("Visualizer button not found");
  }

  await page.waitForTimeout(500);

  // check visualizer is rendered (canvas exists)
  const canvas = page.locator('canvas.w-full.h-full');
  if (await canvas.isVisible()) {
     console.log("Canvas is visible");
  } else {
     console.log("Canvas not visible");
  }

  await browser.close();
})();
