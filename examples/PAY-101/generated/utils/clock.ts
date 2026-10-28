import { Page } from '@playwright/test';

/** Call before openWallet() in tests that use letLateEffectsLand(). */
export async function controlClock(page: Page): Promise<void> {
  await page.clock.install();
}

/**
 * Proving that something did NOT happen (no delayed debit, no second transfer) needs time to pass after the last
 * signal the app gives. The app's send is a 400 ms setTimeout with no network request, so instead of a real sleep
 * this advances the page clock by 1.5 s, which fires every timer due in that window.
 * If the send becomes a real network request, wait on its response instead: the clock doesn't cover the network.
 */
export async function letLateEffectsLand(page: Page): Promise<void> {
  await page.clock.runFor(1500);
}
