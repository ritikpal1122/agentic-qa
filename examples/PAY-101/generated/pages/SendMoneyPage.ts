import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Send money: form, confirm and success screens (one page in the app). */
export class SendMoneyPage extends BasePage {
  // Send form
  get contactSelect(): Locator {
    return this.page.getByTestId('contact');
  }

  /** Contact options, without the "Choose a contact" placeholder (the only option with an empty value). */
  get contactOptions(): Locator {
    return this.contactSelect.getByRole('option').filter({ hasNotText: 'Choose a contact' });
  }

  get textInputs(): Locator {
    return this.page.getByRole('textbox');
  }

  get amountInput(): Locator {
    return this.page.getByTestId('amount');
  }

  get continueButton(): Locator {
    return this.page.getByTestId('continue');
  }

  // Confirm
  get confirmTo(): Locator {
    return this.page.getByTestId('c-to');
  }

  get confirmAmount(): Locator {
    return this.page.getByTestId('c-amount');
  }

  get confirmFee(): Locator {
    return this.page.getByTestId('c-fee');
  }

  get confirmTotal(): Locator {
    return this.page.getByTestId('c-total');
  }

  get sendButton(): Locator {
    return this.page.getByTestId('send');
  }

  get editButton(): Locator {
    return this.page.getByTestId('edit');
  }

  /** Any image on the page. The app has none, so one appearing means entered text was rendered as markup. */
  get images(): Locator {
    return this.page.getByRole('img');
  }

  // Success
  /** No test id or role on this text, so text is the fallback locator. */
  get moneySent(): Locator {
    return this.page.getByText('Money sent', { exact: true });
  }

  get reference(): Locator {
    return this.page.getByTestId('ref');
  }

  get newBalance(): Locator {
    return this.page.getByTestId('new-balance');
  }

  get doneButton(): Locator {
    return this.page.getByTestId('done');
  }

  async chooseContact(name: string): Promise<void> {
    const label = await this.contactOptions.filter({ hasText: name }).textContent();
    await this.contactSelect.selectOption({ label: label ?? name });
  }

  async clearContact(): Promise<void> {
    await this.contactSelect.selectOption('');
  }

  async enterAmount(amount: string): Promise<void> {
    await this.amountInput.fill(amount);
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  /** Pick a contact, enter an amount and press Continue. */
  async fillAndContinue(name: string, amount: string): Promise<void> {
    await this.chooseContact(name);
    await this.enterAmount(amount);
    await this.continue();
  }

  async send(): Promise<void> {
    await this.sendButton.click();
  }

  async edit(): Promise<void> {
    await this.editButton.click();
  }

  async done(): Promise<void> {
    await this.doneButton.click();
  }
}
