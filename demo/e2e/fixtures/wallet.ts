import { test as base, Page } from '@playwright/test';

export type WalletSetup = {
  balance?: number; // paise
  sent?: number;    // paise already sent today
  kyc?: 'basic' | 'full';
  frozen?: boolean;
};

export type WalletState = {
  balance: number;
  sentToday: number;
  ledger: { reference: string; to: string; amount: number; fee: number }[];
};

/** Opens the app with a wallet in a known state. The app reads these from the URL. */
export async function openWallet(page: Page, setup: WalletSetup = {}): Promise<void> {
  const params = new URLSearchParams();
  if (setup.balance !== undefined) params.set('balance', String(setup.balance));
  if (setup.sent !== undefined) params.set('sent', String(setup.sent));
  if (setup.kyc) params.set('kyc', setup.kyc);
  if (setup.frozen) params.set('frozen', '1');
  await page.goto('/?' + params.toString());
}

/** Reads the wallet state the app exposes for tests. */
export async function walletState(page: Page): Promise<WalletState> {
  return page.evaluate(() => {
    const w = (window as any).__paylite;
    return { balance: w.wallet.balance, sentToday: w.wallet.sentToday, ledger: [...w.ledger] };
  });
}

export const test = base;
export { expect } from '@playwright/test';
