import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class InvitePage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get invitedEmail(): Locator {
    return this.page.getByTestId('invite-for');
  }

  get joinButton(): Locator {
    return this.page.getByTestId('join');
  }

  async join(): Promise<void> {
    await this.joinButton.click();
  }
}
