import { test, expect, openWallet } from '../../fixtures/wallet';
import { BasePage } from '../../pages/BasePage';

test('app loads and shows the wallet balance @smoke', async ({ page }) => {
  await openWallet(page, { balance: 500000 });
  const base = new BasePage(page);
  await expect(base.balanceChip).toHaveText('Balance ₹5,000.00');
});
