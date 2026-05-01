import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.frame');
});

test('layout is mounted and visible', async ({ page }) => {
  await expect(page.locator('.frame')).toBeVisible();
});

test('rail icons are present for all panels', async ({ page }) => {
  const labels = ['Explorer', 'Source Control', 'Debug', 'Outline', 'Search', 'Terminal', 'Problems'];
  for (const label of labels) {
    await expect(page.locator(`.frame-rail button[aria-label="${label}"]`)).toBeVisible();
  }
});

test('pinned panels are open by default', async ({ page }) => {
  await expect(page.locator('.frame-dock.left')).toHaveClass(/open/);
  await expect(page.locator('.frame-dock.top')).toHaveClass(/open/);
  await expect(page.locator('.frame-dock.bottom')).toHaveClass(/open/);
});

test('unpinned panel dock is closed by default', async ({ page }) => {
  await expect(page.locator('.frame-dock.right')).not.toHaveClass(/open/);
});

test('clicking a rail icon for an unpinned panel opens its dock', async ({ page }) => {
  await page.locator('.frame-rail button[aria-label="Outline"]').click();
  await expect(page.locator('.frame-dock.right')).toHaveClass(/open/);
  await expect(page.locator('.panel-title').filter({ hasText: 'Outline' })).toBeVisible();
});

test('clicking the same unpinned panel rail icon again closes its dock', async ({ page }) => {
  await page.locator('.frame-rail button[aria-label="Outline"]').click();
  await expect(page.locator('.frame-dock.right')).toHaveClass(/open/);
  await page.locator('.frame-rail button[aria-label="Outline"]').click();
  await expect(page.locator('.frame-dock.right')).not.toHaveClass(/open/);
});

test('switching between panels in the same slot shows the selected panel content', async ({ page }) => {
  await expect(page.locator('.panel.active .panel-title').filter({ hasText: 'Explorer' })).toBeVisible();
  await page.locator('.frame-rail button[aria-label="Source Control"]').click();
  await expect(page.locator('.panel.active .panel-title').filter({ hasText: 'Source Control' })).toBeVisible();
  await expect(page.locator('.panel.active').filter({ hasText: 'Git content' })).toBeVisible();
});

test('close button deactivates panel', async ({ page }) => {
  const explorerPanel = page.locator('.panel').filter({ has: page.locator('.panel-title', { hasText: 'Explorer' }) });
  await explorerPanel.locator('.panel-close').click();
  await expect(explorerPanel).not.toHaveClass(/active/);
});

test('pin button toggles aria-pressed on the rail icon', async ({ page }) => {
  const outlineBtn = page.locator('.frame-rail button[aria-label="Outline"]');
  await outlineBtn.click();

  const pinBtn = page.locator('.panel').filter({ has: page.locator('.panel-title', { hasText: 'Outline' }) }).locator('.panel-pin');
  await expect(pinBtn).toHaveAttribute('aria-pressed', 'false');
  await pinBtn.click();
  await expect(pinBtn).toHaveAttribute('aria-pressed', 'true');
});

test('interactive content in panel: click counter increments', async ({ page }) => {
  const panel = page.locator('.panel').filter({ has: page.locator('.panel-title', { hasText: 'Explorer' }) });
  await expect(panel.locator('p', { hasText: 'Clicks: 0' })).toBeVisible();
  await panel.locator('button', { hasText: 'Click me' }).click();
  await expect(panel.locator('p', { hasText: 'Clicks: 1' })).toBeVisible();
});

test('interactive content in panel: input echoes typed text', async ({ page }) => {
  const panel = page.locator('.panel').filter({ has: page.locator('.panel-title', { hasText: 'Explorer' }) });
  await panel.locator('input').fill('hello');
  await expect(panel.locator('p', { hasText: 'Input: hello' })).toBeVisible();
});

test('clicking outside an open unpinned dock closes it', async ({ page }) => {
  await page.locator('.frame-rail button[aria-label="Outline"]').click();
  await expect(page.locator('.frame-dock.right')).toHaveClass(/open/);
  await page.locator('.frame-stage').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('.frame-dock.right')).not.toHaveClass(/open/);
});

test('dock resizer is present for each edge', async ({ page }) => {
  for (const edge of ['left', 'right', 'top', 'bottom']) {
    await expect(page.locator(`.frame-resizer.${edge}`)).toBeAttached();
  }
});

test('layout state persists across reload', async ({ page }) => {
  await page.locator('.frame-rail button[aria-label="Outline"]').click();
  const pinBtn = page.locator('.panel').filter({ has: page.locator('.panel-title', { hasText: 'Outline' }) }).locator('.panel-pin');
  await pinBtn.click();
  await page.reload();
  await page.waitForSelector('.frame');
  await expect(page.locator('.frame-dock.right')).toHaveClass(/open/);
});

// Rail state
test('rail icon aria-pressed=true when panel is active', async ({ page }) => {
  await expect(page.locator('.frame-rail button[aria-label="Explorer"]')).toHaveAttribute('aria-pressed', 'true');
});

test('rail icon aria-pressed=false when panel is not active', async ({ page }) => {
  await expect(page.locator('.frame-rail button[aria-label="Outline"]')).toHaveAttribute('aria-pressed', 'false');
});

test('rail icon aria-pressed updates when panel is closed via close button', async ({ page }) => {
  await page.locator('.panel').filter({ has: page.locator('.panel-title', { hasText: 'Explorer' }) }).locator('.panel-close').click();
  await expect(page.locator('.frame-rail button[aria-label="Explorer"]')).toHaveAttribute('aria-pressed', 'false');
});

test('rail icon aria-pressed updates when panel is opened via rail click', async ({ page }) => {
  await page.locator('.frame-rail button[aria-label="Outline"]').click();
  await expect(page.locator('.frame-rail button[aria-label="Outline"]')).toHaveAttribute('aria-pressed', 'true');
});

// Dock state
test('dock has pinned class when slot has pinned panels', async ({ page }) => {
  await expect(page.locator('.frame-dock.left')).toHaveClass(/pinned/);
});

test('dock stays open when one slot is closed but the other remains open', async ({ page }) => {
  const explorerPanel = page.locator('.panel').filter({ has: page.locator('.panel-title', { hasText: 'Explorer' }) });
  await explorerPanel.locator('.panel-close').click();
  await expect(page.locator('.frame-dock.left')).toHaveClass(/open/);
});

test('dock closes when all active panels are closed', async ({ page }) => {
  await page.locator('.panel').filter({ has: page.locator('.panel-title', { hasText: 'Explorer' }) }).locator('.panel-close').click();
  await page.locator('.panel').filter({ has: page.locator('.panel-title', { hasText: 'Debug' }) }).locator('.panel-close').click();
  await expect(page.locator('.frame-dock.left')).not.toHaveClass(/open/);
});

test('pinned dock does not close when clicking outside', async ({ page }) => {
  await page.locator('.frame-stage').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('.frame-dock.left')).toHaveClass(/open/);
});

// Splitter
test('splitter is visible when both slots of a dock are open', async ({ page }) => {
  await expect(page.locator('.frame-dock.left .frame-splitter')).not.toHaveClass(/hidden/);
});

test('splitter is hidden when only one slot of a dock is open', async ({ page }) => {
  await page.locator('.panel').filter({ has: page.locator('.panel-title', { hasText: 'Debug' }) }).locator('.panel-close').click();
  await expect(page.locator('.frame-dock.left .frame-splitter')).toHaveClass(/hidden/);
});

// Panel reopen
test('closed panel can be reopened via rail click', async ({ page }) => {
  const panel = page.locator('.panel').filter({ has: page.locator('.panel-title', { hasText: 'Explorer' }) });
  await panel.locator('.panel-close').click();
  await expect(panel).not.toHaveClass(/active/);
  await page.locator('.frame-rail button[aria-label="Explorer"]').click();
  await expect(panel).toHaveClass(/active/);
});

// Panel contents
test('all panel contents are accessible when the panel is active', async ({ page }) => {
  // Source Control shares LeftTop with Explorer — click to switch
  await page.locator('.frame-rail button[aria-label="Source Control"]').click();
  await expect(page.locator('.panel.active').filter({ hasText: 'Git content' })).toBeVisible();

  // The remaining panels are already active (pinned by default)
  await expect(page.locator('.panel.active').filter({ hasText: 'Debug content' })).toBeVisible();
  await expect(page.locator('.panel.active').filter({ hasText: 'Search content' })).toBeVisible();
  await expect(page.locator('.panel.active').filter({ hasText: 'Terminal content' })).toBeVisible();
  await expect(page.locator('.panel.active').filter({ hasText: 'Problems content' })).toBeVisible();
});

// Resize dock via drag
test('dragging the left resizer changes dock width', async ({ page }) => {
  const widthBefore = await page.locator('.frame-dock.left').evaluate(
    (el: HTMLElement) => parseInt(el.style.width, 10),
  );

  await page.evaluate(() => {
    const resizer = document.querySelector('.frame-resizer.left') as HTMLElement;
    const dock = resizer.parentElement!;
    const rect = dock.getBoundingClientRect();
    const x = rect.right - 4;
    const y = rect.top + rect.height / 2;
    resizer.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true, pointerId: 1, clientX: x, clientY: y }));
    resizer.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: x + 80, clientY: y }));
  });

  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));

  const widthAfter = await page.locator('.frame-dock.left').evaluate(
    (el: HTMLElement) => parseInt(el.style.width, 10),
  );

  expect(widthAfter).toBeGreaterThan(widthBefore);
});

// Split ratio via drag
test('dragging the left splitter changes the split ratio between its slots', async ({ page }) => {
  const slotBefore = await page.locator('.frame-dock.left .dock-slot').first().boundingBox();

  await page.evaluate(() => {
    const splitter = document.querySelector('.frame-dock.left .frame-splitter') as HTMLElement;
    const dock = splitter.parentElement!;
    const rect = dock.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    splitter.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true, pointerId: 1, clientX: x, clientY: y }));
    splitter.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: x, clientY: y + 60 }));
    splitter.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
  });

  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));

  const slotAfter = await page.locator('.frame-dock.left .dock-slot').first().boundingBox();

  expect(slotAfter!.height).not.toBeCloseTo(slotBefore!.height, -1);
});

