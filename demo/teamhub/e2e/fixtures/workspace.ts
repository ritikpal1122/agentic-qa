import { test as base, Page } from '@playwright/test';

export type Role = 'owner' | 'admin' | 'member';

export type WorkspaceSetup = {
  plan?: 'free' | 'pro';
  /** Who is signed in on the Members screen. */
  as?: Role;
  /** People besides the owner. Role defaults to member. */
  members?: { email: string; role?: Role }[];
  /** Emails with a pending invite, sent just now. */
  pending?: string[];
};

export type WorkspaceState = {
  plan: 'free' | 'pro';
  members: { email: string; role: Role }[];
  pending: { email: string; sentAt: number }[];
};

function setupParams(setup: WorkspaceSetup): URLSearchParams {
  const params = new URLSearchParams();
  if (setup.plan) params.set('plan', setup.plan);
  if (setup.members?.length) {
    params.set('members', setup.members.map((m) => (m.role ? `${m.email}:${m.role}` : m.email)).join(','));
  }
  if (setup.pending?.length) params.set('pending', setup.pending.join(','));
  return params;
}

/** Opens the Members screen with a workspace in a known state. The app reads these from the URL. */
export async function openWorkspace(page: Page, setup: WorkspaceSetup = {}): Promise<void> {
  const params = setupParams(setup);
  if (setup.as) params.set('role', setup.as);
  await page.goto('/?' + params.toString());
}

/**
 * Opens the invite page for `invite`, as if its link was sent `ageSeconds` ago.
 * The app's clock is frozen at page load, so ages are exact.
 */
export async function openInvite(
  page: Page,
  invite: string,
  ageSeconds = 0,
  setup: WorkspaceSetup = {},
): Promise<void> {
  const params = setupParams(setup);
  params.set('view', 'accept');
  params.set('invite', invite);
  params.set('age', String(ageSeconds));
  await page.goto('/?' + params.toString());
}

/** Reads the workspace state the app exposes for tests. */
export async function workspaceState(page: Page): Promise<WorkspaceState> {
  return page.evaluate(() => {
    const w = (window as any).__teamhub.workspace;
    return { plan: w.plan, members: [...w.members], pending: [...w.pending] };
  });
}

export const test = base;
export { expect } from '@playwright/test';
