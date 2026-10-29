import { test, expect, openWorkspace, pendingEmails, pauseClock } from '../../fixtures/workspace';
import { MembersPage } from '../../pages/MembersPage';

test('TC-1: owner sends an invite on the Free plan @TEAM-42 @smoke', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'owner', members: [{ email: 'ravi@acme.test' }] });
  const members = new MembersPage(page);
  await expect(members.seats).toHaveText('Seats 2 / 3');

  await members.sendInvite('asha@acme.test');

  await expect(members.notice).toHaveText('Invite sent to asha@acme.test'); // R-5
  await expect(members.pendingRows).toHaveCount(1); // R-7
  await expect(members.revokeButton('asha@acme.test')).toBeVisible(); // R-8
  // seats = 1 owner + 1 member + 1 pending = 3
  await expect(members.seats).toHaveText('Seats 3 / 3'); // R-17
  await expect(members.inviteEmail).toHaveValue(''); // R-6
  expect(await pendingEmails(page)).toEqual(['asha@acme.test']);
});

test('TC-2: admin sends an invite @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'pro', as: 'admin', members: [{ email: 'adi@acme.test', role: 'admin' }] });
  const members = new MembersPage(page);
  await expect(members.seats).toHaveText('Seats 2 / 10');

  await members.sendInvite('asha@acme.test');

  await expect(members.notice).toHaveText('Invite sent to asha@acme.test');
  await expect(members.pendingRow('asha@acme.test')).toHaveCount(1);
  // seats = 1 owner + 1 admin + 1 pending = 3
  await expect(members.seats).toHaveText('Seats 3 / 10');
  expect(await pendingEmails(page)).toEqual(['asha@acme.test']);
});

test('TC-3: a member does not see the invite form @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'member', members: [{ email: 'mia@acme.test' }] });
  const members = new MembersPage(page);

  await expect(members.memberRole('owner@acme.test', 'Owner')).toBeVisible();
  await expect(members.memberRole('mia@acme.test', 'Member')).toBeVisible();
  await expect(members.inviteEmail).toBeHidden();
  await expect(members.sendInviteButton).toBeHidden();
});

test('TC-4: a member cannot revoke a pending invite @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, {
    plan: 'free',
    as: 'member',
    members: [{ email: 'mia@acme.test' }],
    pending: ['asha@acme.test'],
  });
  const members = new MembersPage(page);
  await expect(members.seats).toHaveText('Seats 3 / 3');

  // The sources say a member cannot revoke, not whether the control is hidden: if it is offered, use it.
  // Same Revoke locator as TC-20, which proves it finds the control.
  if (await members.revokeButton('asha@acme.test').isVisible()) {
    await members.revoke('asha@acme.test');
  }

  await expect(members.pendingRow('asha@acme.test')).toHaveCount(1);
  await expect(members.seats).toHaveText('Seats 3 / 3');
  expect(await pendingEmails(page)).toEqual(['asha@acme.test']);
});

test('TC-5: email is trimmed and lower-cased before saving @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'owner' });
  const members = new MembersPage(page);

  await members.sendInvite('  Asha@Acme.test  ');

  // The email's form inside the message is not specified; only the prefix is asserted.
  await expect(members.notice).toHaveText(/^Invite sent to /);
  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.pendingRow('asha@acme.test')).toHaveCount(1);
  expect(await pendingEmails(page)).toEqual(['asha@acme.test']);
  // seats = 1 owner + 1 pending = 2
  await expect(members.seats).toHaveText('Seats 2 / 3');
});

test('TC-6: a case variant of a pending invite is "Already invited" @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'owner', pending: ['asha@acme.test'] });
  const members = new MembersPage(page);
  // seats = 1 owner + 1 pending = 2, unchanged by a refused invite
  await expect(members.seats).toHaveText('Seats 2 / 3');

  await members.sendInvite('ASHA@acme.test');

  await expect(members.errorMessage).toHaveText('Already invited');
  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.pendingRow('asha@acme.test')).toHaveCount(1);
  expect(await pendingEmails(page)).toEqual(['asha@acme.test']);
  await expect(members.seats).toHaveText('Seats 2 / 3');
});

test('TC-7: an exact duplicate of a pending invite is "Already invited" @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'owner', pending: ['asha@acme.test'] });
  const members = new MembersPage(page);

  await members.sendInvite('asha@acme.test');

  await expect(members.errorMessage).toHaveText('Already invited');
  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.seats).toHaveText('Seats 2 / 3');
  expect(await pendingEmails(page)).toEqual(['asha@acme.test']);
});

test('TC-8: a case variant of a member is "Already a member" @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'owner', members: [{ email: 'ravi@acme.test' }] });
  const members = new MembersPage(page);
  // seats = 1 owner + 1 member = 2, unchanged by a refused invite
  await expect(members.seats).toHaveText('Seats 2 / 3');

  await members.sendInvite('Ravi@Acme.test');

  await expect(members.errorMessage).toHaveText('Already a member');
  await expect(members.pendingEmpty).toHaveText('(none)');
  expect(await pendingEmails(page)).toEqual([]);
  await expect(members.seats).toHaveText('Seats 2 / 3');
});

test('TC-9: the exact email of a member is "Already a member" @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'owner', members: [{ email: 'ravi@acme.test' }] });
  const members = new MembersPage(page);

  await members.sendInvite('ravi@acme.test');

  await expect(members.errorMessage).toHaveText('Already a member');
  await expect(members.pendingEmpty).toHaveText('(none)');
  await expect(members.seats).toHaveText('Seats 2 / 3');
  expect(await pendingEmails(page)).toEqual([]);
});

const INVALID_EMAILS: { input: string; why: string }[] = [
  { input: 'asha.acme.test', why: 'no @' },
  { input: 'asha@acme', why: 'no dot after @' },
  { input: 'asha@@acme.test', why: 'two @' },
  { input: 'asha smith@acme.test', why: 'space inside' },
  { input: '@acme.test', why: 'empty local part' },
  { input: 'asha@.test', why: 'empty domain label' },
  { input: 'asha@acme.', why: 'empty top-level part' },
  { input: '', why: 'empty' },
  { input: '   ', why: 'only spaces' },
];

for (const { input, why } of INVALID_EMAILS) {
  test(`TC-10: invalid address is refused (${why}) @TEAM-42 @regression`, async ({ page }) => {
    await openWorkspace(page, { plan: 'free', as: 'owner' });
    const members = new MembersPage(page);

    await members.sendInvite(input);

    await expect(members.errorMessage).toHaveText('Enter a valid email address');
    await expect(members.pendingEmpty).toHaveText('(none)');
    // seats = 1 owner, unchanged
    await expect(members.seats).toHaveText('Seats 1 / 3');
    expect(await pendingEmails(page)).toEqual([]);
  });
}

test('TC-11: the shortest valid address is accepted @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'owner' });
  const members = new MembersPage(page);

  // a @ b . c: one character in each part of ^[^@\s]+@[^@\s]+\.[^@\s]+$
  await members.sendInvite('a@b.c');

  await expect(members.notice).toHaveText('Invite sent to a@b.c');
  await expect(members.pendingRow('a@b.c')).toHaveCount(1);
  // seats = 1 owner + 1 pending = 2
  await expect(members.seats).toHaveText('Seats 2 / 3');
  expect(await pendingEmails(page)).toEqual(['a@b.c']);
});

test('TC-34: a double press of Send invite creates one invite @TEAM-42 @regression', async ({ page }) => {
  await pauseClock(page);
  await openWorkspace(page, { plan: 'free', as: 'owner' });
  const members = new MembersPage(page);
  await expect(members.seats).toHaveText('Seats 1 / 3');

  await members.inviteEmail.fill('asha@acme.test');
  await members.sendInviteButton.dblclick();
  await page.clock.runFor(1000); // more than two 400 ms responses

  // Either answer to the second press is correct: the NH-8 default, or "Already invited" per R-13.
  await expect(members.notice.or(members.errorMessage)).toHaveText(
    /^(Invite sent to asha@acme\.test|Already invited)$/,
  );
  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.pendingRow('asha@acme.test')).toHaveCount(1);
  // seats = 1 owner + 1 pending = 2
  await expect(members.seats).toHaveText('Seats 2 / 3');
  expect(await pendingEmails(page)).toEqual(['asha@acme.test']);
});

test('TC-36: duplicate check after a send with different case @TEAM-42 @regression', async ({ page }) => {
  await openWorkspace(page, { plan: 'free', as: 'owner' });
  const members = new MembersPage(page);

  await members.sendInvite('Asha@Acme.test');
  await expect(members.notice).toHaveText(/^Invite sent to /);
  await members.sendInvite('asha@acme.test');

  await expect(members.errorMessage).toHaveText('Already invited');
  await expect(members.pendingRows).toHaveCount(1);
  await expect(members.pendingRow('asha@acme.test')).toHaveCount(1);
  // seats = 1 owner + 1 pending = 2
  await expect(members.seats).toHaveText('Seats 2 / 3');
  expect(await pendingEmails(page)).toEqual(['asha@acme.test']);
});
