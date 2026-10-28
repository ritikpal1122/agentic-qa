import { Page } from '@playwright/test';
import { expect, walletState } from '../../fixtures/wallet';
import { SendMoneyPage } from '../../pages/SendMoneyPage';

/** Contact ids the app stores in ledger[].to (demo/app/index.html contacts list). */
export const CONTACT_ID = { 'Aman Verma': 'c_41', 'Priya Nair': 'c_42', 'Kabir Shah': 'c_43' } as const;

export const KNOWN_ERRORS = /^(Insufficient balance|Daily limit exceeded|Amount must be between ₹1 and ₹50,000|Enter a valid amount)$/;

/** "No transfer" from 03 Test data: no confirm or success screen, chip unchanged, no new ledger row, balance unchanged. */
export async function expectNoTransfer(
  page: Page,
  sendMoney: SendMoneyPage,
  expected: { chip: string; balance: number; transfers: number },
): Promise<void> {
  await expect(sendMoney.sendButton).toBeHidden();
  await expect(sendMoney.moneySent).toBeHidden();
  await expect(sendMoney.balanceChip).toHaveText(expected.chip);
  const state = await walletState(page);
  expect(state.ledger).toHaveLength(expected.transfers);
  expect(state.balance).toBe(expected.balance);
}
