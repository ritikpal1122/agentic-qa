import { test, expect, openWorkspace, pendingEmails } from '../../fixtures/workspace';
import { MembersPage } from '../../pages/MembersPage';

const SEAT_LIMIT_MESSAGE = 'Seat limit reached. Upgrade to Pro to add more people.'; // PRD §3

test('TC-18: revoke removes the invite and frees its seat @TEAM-42 @smoke', async ({ page }) => {
  await openWorkspace(page, {
    plan: 'free',
    as: 'owner',
    members: [{ email: 'ravi@acme.test' }],
    pending: ['mia@acme.test'],
  });
  const members = new MembersPage(page);
  await expect(members.seats).toHaveText('Seats 3 / 3');

  await members.revoke('mia@acme.test');

  await expect(members.pendingEmpty).toHaveText('(none)');
  // seats = 3 − 1 pending = 2
  await expect(members.seats).toHaveText('Seats 2 / 3');
  expect(await pendingEmails(page)).toEqual([]);
});

test('TC-19: a seat freed by revoke can be used straight away @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, {
    plan: 'free',
    as: 'owner',
    members: [{ email: 'ravi@acme.test' }],
    pending: ['mia@acme.test'],
  });
  const members = new MembersPage(page);
  await expect(members.seats).toHaveText('Seats 3 / 3');

  // Steps 1–2: the plan is really full before the revoke (1 owner + 1 member + 1 pending = 3)
  await members.sendInvite('asha@acme.test');
  await expect(members.errorMessage).toHaveText(SEAT_LIMIT_MESSAGE);
  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.pendingRow('mia@acme.test')).toHaveCount(1);
  expect(await pendingEmails(page)).toEqual(['mia@acme.test']);
  // Step 3: revoke → 2 / 3
  await members.revoke('mia@acme.test');
  // Step 4: send again → 3 / 3
  await members.sendInvite('asha@acme.test');

  await expect(members.notice).toHaveText('Invite sent to asha@acme.test');
  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.pendingRow('asha@acme.test')).toHaveCount(1);
  await expect(members.seats).toHaveText('Seats 3 / 3');
  expect(await pendingEmails(page)).toEqual(['asha@acme.test']);
});

test('TC-20: an admin can revoke @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, {
    plan: 'free',
    as: 'admin',
    members: [{ email: 'adi@acme.test', role: 'admin' }],
    pending: ['mia@acme.test'],
  });
  const members = new MembersPage(page);
  await expect(members.seats).toHaveText('Seats 3 / 3');

  await members.revoke('mia@acme.test');

  await expect(members.pendingEmpty).toHaveText('(none)');
  // seats = 1 owner + 1 admin + 1 pending − 1 revoked = 2
  await expect(members.seats).toHaveText('Seats 2 / 3');
  expect(await pendingEmails(page)).toEqual([]);
});

test('TC-21: members are listed with roles, then pending invites @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, {
    plan: 'pro',
    as: 'owner',
    members: [{ email: 'ravi@acme.test' }, { email: 'adi@acme.test', role: 'admin' }],
    pending: ['mia@acme.test'],
  });
  const members = new MembersPage(page);

  await expect(members.memberRows).toHaveCount(3);
  await expect(members.memberRole('owner@acme.test', 'Owner')).toBeVisible();
  await expect(members.memberRole('ravi@acme.test', 'Member')).toBeVisible();
  await expect(members.memberRole('adi@acme.test', 'Admin')).toBeVisible();
  await expect(members.revokeButton('mia@acme.test')).toBeVisible();

  // Pending section is below the Members section: its top is at or below the Members list's bottom.
  const membersBox = await members.membersList.boundingBox();
  const pendingBox = await members.pendingList.boundingBox();
  expect(membersBox).not.toBeNull();
  expect(pendingBox).not.toBeNull();
  expect(pendingBox!.y).toBeGreaterThanOrEqual(membersBox!.y + membersBox!.height);
});

test('TC-30: members screen loads with plan and seats @TEAM-42 @smoke', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await openWorkspace(page, { as: 'owner' });
  const members = new MembersPage(page);

  await expect(members.workspaceName).toHaveText('Acme');
  await expect(members.plan).toHaveText('Free plan');
  await expect(members.seats).toHaveText('Seats 1 / 3');
  await expect(members.memberRows).toHaveCount(1);
  await expect(members.memberRole('owner@acme.test', 'Owner')).toBeVisible();
  await expect(members.pendingEmpty).toHaveText('(none)');
  expect(pageErrors).toEqual([]);
});

test('TC-35: revoking one of two invites leaves the other @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'owner', pending: ['mia@acme.test', 'lee@acme.test'] });
  const members = new MembersPage(page);
  // seats = 1 owner + 2 pending = 3
  await expect(members.seats).toHaveText('Seats 3 / 3');

  await members.revoke('mia@acme.test');

  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.pendingRow('lee@acme.test')).toHaveCount(1);
  // seats = 3 − 1 = 2
  await expect(members.seats).toHaveText('Seats 2 / 3');
  expect(await pendingEmails(page)).toEqual(['lee@acme.test']);
});
