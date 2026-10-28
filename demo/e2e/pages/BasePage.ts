import { Locator, Page } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  get balanceChip(): Locator {
    return this.page.getByTestId('balance');
  }

  get errorMessage(): Locator {
    return this.page.getByTestId('error');
  }
}
