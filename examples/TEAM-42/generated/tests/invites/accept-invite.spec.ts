import { test, expect, openInvite, workspaceState, pauseClock, WorkspaceState } from '../../fixtures/workspace';
import { InvitePage } from '../../pages/InvitePage';

// 7 days = 7 × 24 × 3600 s
const SEVEN_DAYS_S = 604_800;

const seatsUsed = (state: WorkspaceState) => state.members.length + state.pending.length;
const memberEmails = (state: WorkspaceState) => state.members.map((m) => m.email);
const pendingEmails = (state: WorkspaceState) => state.pending.map((p) => p.email);

test('TC-22: invite page shows the workspace, the email and Join @TEAM-42 @regression', async ({ page }) => {
  await openInvite(page, 'asha@acme.test', 0);
  const invite = new InvitePage(page);

  await expect(invite.heading).toHaveText("You're invited to Acme");
  await expect(invite.invitedEmail).toHaveText('asha@acme.test');
  await expect(invite.joinButton).toHaveText('Join workspace');
});

test('TC-23: joining with a valid link makes the person a member @TEAM-42 @smoke', async ({ page }) => {
  await openInvite(page, 'asha@acme.test', 0);
  const invite = new InvitePage(page);

  await invite.join();

  await expect(invite.notice).toHaveText('You joined Acme');
  const state = await workspaceState(page);
  expect(state.members).toContainEqual({ email: 'asha@acme.test', role: 'member' });
  expect(pendingEmails(state)).not.toContain('asha@acme.test');
});

test('TC-24: accepting does not use a new seat @TEAM-42 @regression', async ({ page }) => {
  await openInvite(page, 'asha@acme.test', 0);
  const invite = new InvitePage(page);
  const before = await workspaceState(page);
  // before: 1 member (owner) + 1 pending (asha) = 2
  expect(before.members).toHaveLength(1);
  expect(before.pending).toHaveLength(1);
  expect(seatsUsed(before)).toBe(2);

  await invite.join();
  await expect(invite.notice).toHaveText('You joined Acme');

  // after: 2 members + 0 pending = 2
  const after = await workspaceState(page);
  expect(after.members).toHaveLength(2);
  expect(after.pending).toHaveLength(0);
  expect(seatsUsed(after)).toBe(2);
});

test('TC-25: a link one second before 7 days still works @TEAM-42 @regression', async ({ page }) => {
  // 604 799 s < 604 800 s → valid
  await openInvite(page, 'asha@acme.test', SEVEN_DAYS_S - 1);
  const invite = new InvitePage(page);

  await invite.join();

  await expect(invite.notice).toHaveText('You joined Acme');
  expect(memberEmails(await workspaceState(page))).toContain('asha@acme.test');
});

test('TC-26: a link at exactly 7 days is expired @TEAM-42 @regression', async ({ page }) => {
  // valid only while now < sentAt + 604 800 s; now = sentAt + 604 800 s → expired
  await openInvite(page, 'asha@acme.test', SEVEN_DAYS_S);
  const invite = new InvitePage(page);

  await invite.join();

  await expect(invite.errorMessage).toHaveText('This invite has expired');
  await expect(invite.notice).toHaveCount(0);
  const state = await workspaceState(page);
  expect(memberEmails(state)).toEqual(['owner@acme.test']);
  expect(pendingEmails(state)).toEqual(['asha@acme.test']);
});

test('TC-27: a link one second past 7 days is expired @TEAM-42 @regression', async ({ page }) => {
  // 604 801 s ≥ 604 800 s → expired
  await openInvite(page, 'asha@acme.test', SEVEN_DAYS_S + 1);
  const invite = new InvitePage(page);

  await invite.join();

  await expect(invite.errorMessage).toHaveText('This invite has expired');
  await expect(invite.notice).toHaveCount(0);
  const state = await workspaceState(page);
  expect(memberEmails(state)).toEqual(['owner@acme.test']);
  expect(pendingEmails(state)).toEqual(['asha@acme.test']);
});

test('TC-28: a double click on Join creates exactly one member @TEAM-42 @regression', async ({ page }) => {
  await pauseClock(page);
  await openInvite(page, 'asha@acme.test', 0);
  const invite = new InvitePage(page);

  await invite.joinButton.dblclick();
  // Both clicks went in before any response: nothing has answered yet.
  await expect(invite.notice).toHaveCount(0);
  await expect(invite.errorMessage).toHaveCount(0);
  await page.clock.runFor(1000); // more than two 400 ms responses
  // Which response renders last is not specified (NH-11); wait for one, then check the state.
  await expect(invite.notice.or(invite.errorMessage)).toBeVisible();

  const state = await workspaceState(page);
  // owner + asha = 2
  expect(memberEmails(state).filter((e) => e === 'asha@acme.test')).toHaveLength(1);
  expect(state.members).toHaveLength(2);
  expect(pendingEmails(state)).not.toContain('asha@acme.test');
});

test('TC-29: pressing Join again after joining does not add a second member @TEAM-42 @regression', async ({ page }) => {
  await pauseClock(page);
  await openInvite(page, 'asha@acme.test', 0);
  const invite = new InvitePage(page);

  await invite.join();
  await page.clock.runFor(400);
  await expect(invite.notice).toHaveText('You joined Acme');
  // A correct product may hide or disable Join after joining; press again only if it is still offered.
  if ((await invite.joinButton.isVisible()) && (await invite.joinButton.isEnabled())) {
    await invite.join();
  }
  await page.clock.runFor(1000);

  const state = await workspaceState(page);
  expect(memberEmails(state).filter((e) => e === 'asha@acme.test')).toHaveLength(1);
  expect(state.members).toHaveLength(2);
});

test('TC-33: a full workspace can still accept its pending invite @TEAM-42 @regression', async ({ page }) => {
  await openInvite(page, 'asha@acme.test', 0, { plan: 'free', members: [{ email: 'ravi@acme.test' }] });
  const invite = new InvitePage(page);
  // before: 2 members (owner, ravi) + 1 pending (asha) = 3 = Free limit
  expect(seatsUsed(await workspaceState(page))).toBe(3);

  await invite.join();

  await expect(invite.notice).toHaveText('You joined Acme');
  // after: 3 members + 0 pending = 3
  const state = await workspaceState(page);
  expect(state.members).toHaveLength(3);
  expect(memberEmails(state)).toContain('asha@acme.test');
  expect(state.pending).toHaveLength(0);
  expect(seatsUsed(state)).toBe(3);
});
