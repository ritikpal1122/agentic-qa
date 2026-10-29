import { test, expect, openWorkspace } from '../../fixtures/workspace';
import { BasePage } from '../../pages/BasePage';

test('members screen loads and shows seats @smoke', async ({ page }) => {
  await openWorkspace(page, { members: [{ email: 'ravi@acme.test' }] });
  const base = new BasePage(page);
  await expect(base.seats).toHaveText('Seats 2 / 3');
});
