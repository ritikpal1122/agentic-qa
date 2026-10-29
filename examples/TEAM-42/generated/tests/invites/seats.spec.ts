import { test, expect, openWorkspace, pendingEmails } from '../../fixtures/workspace';
import { MembersPage } from '../../pages/MembersPage';

const SEAT_LIMIT_MESSAGE = 'Seat limit reached. Upgrade to Pro to add more people.'; // PRD §3

const PRO_MEMBERS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ email: `m${n}@acme.test` }));

test('TC-12: Free plan at the limit with members only @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, {
    plan: 'free',
    as: 'owner',
    members: [{ email: 'ravi@acme.test' }, { email: 'mia@acme.test' }],
  });
  const members = new MembersPage(page);
  // seats = 1 owner + 2 members = 3 = Free limit 3 → refused
  await expect(members.seats).toHaveText('Seats 3 / 3');

  await members.sendInvite('asha@acme.test');

  await expect(members.errorMessage).toHaveText(SEAT_LIMIT_MESSAGE);
  await expect(members.pendingEmpty).toHaveText('(none)');
  await expect(members.seats).toHaveText('Seats 3 / 3');
  expect(await pendingEmails(page)).toEqual([]);
});

test('TC-13: Free plan at the limit because of a pending invite @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, {
    plan: 'free',
    as: 'owner',
    members: [{ email: 'ravi@acme.test' }],
    pending: ['mia@acme.test'],
  });
  const members = new MembersPage(page);
  // seats = 1 owner + 1 member + 1 pending = 3 = limit → refused
  await expect(members.seats).toHaveText('Seats 3 / 3');

  await members.sendInvite('asha@acme.test');

  await expect(members.errorMessage).toHaveText(SEAT_LIMIT_MESSAGE);
  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.pendingRow('mia@acme.test')).toHaveCount(1);
  await expect(members.seats).toHaveText('Seats 3 / 3');
  expect(await pendingEmails(page)).toEqual(['mia@acme.test']);
});

test('TC-14: Free plan one below the limit with a pending invite @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'owner', pending: ['mia@acme.test'] });
  const members = new MembersPage(page);
  // seats = 1 owner + 1 pending = 2 < 3 → allowed
  await expect(members.seats).toHaveText('Seats 2 / 3');

  await members.sendInvite('asha@acme.test');

  await expect(members.notice).toHaveText('Invite sent to asha@acme.test');
  await expect(members.pendingRows).toHaveCount(2);
  await expect(members.pendingRow('mia@acme.test')).toHaveCount(1);
  await expect(members.pendingRow('asha@acme.test')).toHaveCount(1);
  await expect(members.seats).toHaveText('Seats 3 / 3');
  expect(await pendingEmails(page)).toEqual(['mia@acme.test', 'asha@acme.test']);
});

test('TC-15: Pro plan header counts members and pending @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, {
    plan: 'pro',
    as: 'owner',
    members: [{ email: 'ravi@acme.test' }],
    pending: ['mia@acme.test'],
  });
  const members = new MembersPage(page);

  // seats = 1 owner + 1 member + 1 pending = 3; Pro limit 10
  await expect(members.seats).toHaveText('Seats 3 / 10');
});

test('TC-16: Pro plan at the limit, reached with a pending invite @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'pro', as: 'owner', members: PRO_MEMBERS, pending: ['p1@acme.test'] });
  const members = new MembersPage(page);
  // seats = 1 owner + 8 members + 1 pending = 10 = Pro limit → refused
  await expect(members.seats).toHaveText('Seats 10 / 10');

  await members.sendInvite('asha@acme.test');

  await expect(members.errorMessage).toHaveText(SEAT_LIMIT_MESSAGE);
  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.pendingRow('p1@acme.test')).toHaveCount(1);
  await expect(members.seats).toHaveText('Seats 10 / 10');
  expect(await pendingEmails(page)).toEqual(['p1@acme.test']);
});

test('TC-17: Pro plan one below the limit @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'pro', as: 'owner', members: PRO_MEMBERS });
  const members = new MembersPage(page);
  // seats = 1 owner + 8 members = 9 < 10 → allowed
  await expect(members.seats).toHaveText('Seats 9 / 10');

  await members.sendInvite('asha@acme.test');

  await expect(members.notice).toHaveText('Invite sent to asha@acme.test');
  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.pendingRow('asha@acme.test')).toHaveCount(1);
  // seats = 9 + 1 pending = 10
  await expect(members.seats).toHaveText('Seats 10 / 10');
  expect(await pendingEmails(page)).toEqual(['asha@acme.test']);
});

test('TC-31: at the limit, a pending duplicate gets "Already invited" @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, {
    plan: 'free',
    as: 'owner',
    members: [{ email: 'ravi@acme.test' }],
    pending: ['mia@acme.test'],
  });
  const members = new MembersPage(page);
  await expect(members.seats).toHaveText('Seats 3 / 3');

  await members.sendInvite('mia@acme.test');

  await expect(members.errorMessage).toHaveText('Already invited');
  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.seats).toHaveText('Seats 3 / 3');
  expect(await pendingEmails(page)).toEqual(['mia@acme.test']);
});

test('TC-32: at the limit, a member email gets "Already a member" @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, {
    plan: 'free',
    as: 'owner',
    members: [{ email: 'ravi@acme.test' }, { email: 'mia@acme.test' }],
  });
  const members = new MembersPage(page);
  await expect(members.seats).toHaveText('Seats 3 / 3');

  await members.sendInvite('ravi@acme.test');

  await expect(members.errorMessage).toHaveText('Already a member');
  await expect(members.pendingEmpty).toHaveText('(none)');
  await expect(members.seats).toHaveText('Seats 3 / 3');
  expect(await pendingEmails(page)).toEqual([]);
});

test('TC-37: filling the Free plan through the UI @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'owner' });
  const members = new MembersPage(page);
  await expect(members.seats).toHaveText('Seats 1 / 3');

  await members.sendInvite('a1@acme.test');
  await expect(members.notice).toHaveText('Invite sent to a1@acme.test');
  await expect(members.seats).toHaveText('Seats 2 / 3');
  await members.sendInvite('a2@acme.test');
  await expect(members.notice).toHaveText('Invite sent to a2@acme.test');
  await expect(members.seats).toHaveText('Seats 3 / 3');
  // seats = 1 owner + 2 pending = 3 = limit → the third is refused
  await members.sendInvite('a3@acme.test');

  await expect(members.errorMessage).toHaveText(SEAT_LIMIT_MESSAGE);
  await expect(members.pendingRows).toHaveCount(2);
  await expect(members.pendingRow('a1@acme.test')).toHaveCount(1);
  await expect(members.pendingRow('a2@acme.test')).toHaveCount(1);
  expect(await pendingEmails(page)).toEqual(['a1@acme.test', 'a2@acme.test']);
  await expect(members.seats).toHaveText('Seats 3 / 3');
});
