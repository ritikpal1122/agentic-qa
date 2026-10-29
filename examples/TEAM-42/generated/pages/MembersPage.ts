import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MembersPage extends BasePage {
  get workspaceName(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get plan(): Locator {
    return this.page.getByTestId('plan');
  }

  get membersList(): Locator {
    return this.page.getByTestId('members');
  }

  get pendingList(): Locator {
    return this.page.getByTestId('pending');
  }

  get memberRows(): Locator {
    return this.page.getByTestId('member-row');
  }

  get pendingRows(): Locator {
    return this.page.getByTestId('pending-row');
  }

  get pendingEmpty(): Locator {
    return this.page.getByTestId('pending-empty');
  }

  get inviteEmail(): Locator {
    return this.page.getByTestId('invite-email');
  }

  get sendInviteButton(): Locator {
    return this.page.getByTestId('invite-submit');
  }

  /** The member row whose email is exactly `email` (case-sensitive). */
  memberRow(email: string): Locator {
    return this.memberRows.filter({ has: this.page.getByText(email, { exact: true }) });
  }

  /** The role label inside a member's row, e.g. 'Owner'. */
  memberRole(email: string, label: string): Locator {
    return this.memberRow(email).getByText(label, { exact: true });
  }

  /** The pending row whose email is exactly `email` (case-sensitive). */
  pendingRow(email: string): Locator {
    return this.pendingRows.filter({ has: this.page.getByText(email, { exact: true }) });
  }

  revokeButton(email: string): Locator {
    return this.pendingRow(email).getByTestId('revoke');
  }

  async sendInvite(email: string): Promise<void> {
    await this.inviteEmail.fill(email);
    await this.sendInviteButton.click();
  }

  async revoke(email: string): Promise<void> {
    await this.revokeButton(email).click();
  }
}
