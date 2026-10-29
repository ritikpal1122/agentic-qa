import { Locator, Page } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  get seats(): Locator {
    return this.page.getByTestId('seats');
  }

  get errorMessage(): Locator {
    return this.page.getByTestId('error');
  }

  get notice(): Locator {
    return this.page.getByTestId('notice');
  }
}
