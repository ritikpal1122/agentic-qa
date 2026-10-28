import { test, expect, openWallet, walletState } from '../../fixtures/wallet';
import { SendMoneyPage } from '../../pages/SendMoneyPage';
import { controlClock, letLateEffectsLand } from '../../utils/clock';
import { KNOWN_ERRORS, expectNoTransfer } from './checks';

test.describe('Balance', () => {
  test('TC-23: balance exactly equal to amount + fee is allowed @PAY-101 @smoke', async ({ page }) => {
    await openWallet(page, { balance: 10200 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '100.00');
    // fee max(₹2.00, ₹1.00) = ₹2.00; total ₹102.00 = balance
    await expect(sendMoney.confirmTotal).toHaveText('₹102.00');
    await expect(sendMoney.sendButton).toHaveText('Send ₹102.00');
    await sendMoney.send();

    await expect(sendMoney.moneySent).toBeVisible();
    await expect(sendMoney.newBalance).toHaveText('New balance ₹0.00');
    const state = await walletState(page);
    expect(state.ledger).toHaveLength(1);
    expect(state.balance).toBe(0);
  });

  test('TC-24: balance one paisa short of amount + fee is rejected @PAY-101 @regression', async ({ page }) => {
    await openWallet(page, { balance: 10199 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '100.00');

    // total ₹102.00 > ₹101.99: covers the amount but not the fee
    await expect(sendMoney.errorMessage).toHaveText('Insufficient balance');
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹101.99', balance: 10199, transfers: 0 });
  });

  test('TC-25: balance below the amount is rejected @PAY-101 @regression', async ({ page }) => {
    await openWallet(page, { balance: 5000 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '100.00');

    // total ₹102.00 > ₹50.00; the amount alone already exceeds the balance
    await expect(sendMoney.errorMessage).toHaveText('Insufficient balance');
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹50.00', balance: 5000, transfers: 0 });
  });
});

test.describe('Daily limit', () => {
  test('TC-26: KYC basic send that lands exactly on ₹10,000.00 is allowed @PAY-101 @regression', async ({ page }) => {
    // Provisional on Q-4: the fee is not counted toward the limit
    await openWallet(page, { balance: 500000, kyc: 'basic', sent: 600000 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '4000.00');
    // ₹6,000.00 + ₹4,000.00 = ₹10,000.00 ≤ ₹10,000.00; fee ₹40.00; total ₹4,040.00 ≤ ₹5,000.00
    await expect(sendMoney.errorMessage).toHaveText('');
    await expect(sendMoney.confirmAmount).toHaveText('₹4,000.00');
    await expect(sendMoney.confirmFee).toHaveText('₹40.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹4,040.00');

    await sendMoney.send();
    // ₹5,000.00 − ₹4,040.00 = ₹960.00
    await expect(sendMoney.newBalance).toHaveText('New balance ₹960.00');
    const state = await walletState(page);
    expect(state.ledger).toHaveLength(1);
    expect(state.balance).toBe(96000);
  });

  test('TC-27: KYC basic one paisa over the daily limit is rejected @PAY-101 @smoke', async ({ page }) => {
    await openWallet(page, { balance: 500000, kyc: 'basic', sent: 600000 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '4000.01');

    // ₹6,000.00 + ₹4,000.01 = ₹10,000.01 > ₹10,000.00; balance is fine (total ₹4,040.02)
    await expect(sendMoney.errorMessage).toHaveText('Daily limit exceeded');
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹5,000.00', balance: 500000, transfers: 0 });
  });

  test('TC-28: KYC full send that lands exactly on ₹1,00,000.00 is allowed @PAY-101 @regression', async ({ page }) => {
    // Provisional on Q-4: the fee is not counted toward the limit
    await openWallet(page, { balance: 6000000, kyc: 'full', sent: 5000000 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '50000.00');
    // ₹50,000.00 + ₹50,000.00 = ₹1,00,000.00 ≤ limit; fee ₹500.00; total ₹50,500.00 ≤ ₹60,000.00
    await expect(sendMoney.errorMessage).toHaveText('');
    await expect(sendMoney.confirmAmount).toHaveText('₹50,000.00');
    await expect(sendMoney.confirmFee).toHaveText('₹500.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹50,500.00');

    await sendMoney.send();
    // ₹60,000.00 − ₹50,500.00 = ₹9,500.00
    await expect(sendMoney.newBalance).toHaveText('New balance ₹9,500.00');
    const state = await walletState(page);
    expect(state.ledger).toHaveLength(1);
    expect(state.balance).toBe(950000);
  });

  test('TC-29: KYC full one paisa over the daily limit is rejected @PAY-101 @regression', async ({ page }) => {
    await openWallet(page, { balance: 6000000, kyc: 'full', sent: 5000001 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '50000.00');

    // ₹50,000.01 + ₹50,000.00 = ₹1,00,000.01 > ₹1,00,000.00
    await expect(sendMoney.errorMessage).toHaveText('Daily limit exceeded');
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹60,000.00', balance: 6000000, transfers: 0 });
  });

  test('TC-30: second send in a session counts the first toward the daily limit @PAY-101 @regression', async ({ page }) => {
    await openWallet(page, { balance: 2000000, kyc: 'basic', sent: 0 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '6000.00');
    await expect(sendMoney.sendButton).toHaveText('Send ₹6,060.00');
    await sendMoney.send();
    // fee ₹60.00; ₹20,000.00 − ₹6,060.00 = ₹13,940.00
    await expect(sendMoney.newBalance).toHaveText('New balance ₹13,940.00');
    await sendMoney.done();

    await sendMoney.fillAndContinue('Aman Verma', '4000.01');

    // daily total ₹6,000.00 + ₹4,000.01 = ₹10,000.01 > ₹10,000.00 (.01 so this doesn't depend on B-3)
    await expect(sendMoney.errorMessage).toHaveText('Daily limit exceeded');
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹13,940.00', balance: 1394000, transfers: 1 });
  });

  test('TC-31: second send in a session uses the reduced balance @PAY-101 @regression', async ({ page }) => {
    await openWallet(page, { balance: 110000 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '1000.00');
    await expect(sendMoney.sendButton).toHaveText('Send ₹1,010.00');
    await sendMoney.send();
    // ₹1,100.00 − ₹1,010.00 = ₹90.00
    await expect(sendMoney.newBalance).toHaveText('New balance ₹90.00');
    await sendMoney.done();

    await sendMoney.fillAndContinue('Priya Nair', '100.00');

    // ₹100.00 alone exceeds ₹90.00, so this doesn't depend on B-2
    await expect(sendMoney.errorMessage).toHaveText('Insufficient balance');
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹90.00', balance: 9000, transfers: 1 });
  });

  test('TC-43: fees of earlier sends are not counted in today\'s total @PAY-101 @regression', async ({ page }) => {
    // Provisional on Q-4
    await openWallet(page, { balance: 2000000, kyc: 'basic', sent: 0 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '6000.00');
    await expect(sendMoney.sendButton).toHaveText('Send ₹6,060.00');
    await sendMoney.send();
    // fee ₹60.00; ₹20,000.00 − ₹6,060.00 = ₹13,940.00
    await expect(sendMoney.newBalance).toHaveText('New balance ₹13,940.00');
    await sendMoney.done();

    await sendMoney.fillAndContinue('Aman Verma', '3999.99');

    // ₹6,000.00 + ₹3,999.99 = ₹9,999.99 ≤ ₹10,000.00 (with the earlier fee: ₹10,059.99 → blocked)
    // fee: 1% of ₹3,999.99 = ₹39.9999 → ₹40.00; total ₹4,039.99
    await expect(sendMoney.errorMessage).toHaveText('');
    await expect(sendMoney.confirmAmount).toHaveText('₹3,999.99');
    await expect(sendMoney.confirmFee).toHaveText('₹40.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹4,039.99');
  });
});

test.describe('Frozen wallet and check order', () => {
  test('TC-32: frozen wallet cannot send @PAY-101 @regression', async ({ page }) => {
    // Provisional on Q-10 (blocked at Continue) and Q-2 (frozen error text unknown)
    await controlClock(page);
    await openWallet(page, { frozen: true });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '100.00');
    // Catches a delayed debit
    await letLateEffectsLand(page);

    await expect(sendMoney.errorMessage).toHaveText(/\S/);
    await expect(sendMoney.errorMessage).not.toHaveText(KNOWN_ERRORS);
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹5,000.00', balance: 500000, transfers: 0 });
  });

  test('TC-33: balance is checked before the daily limit @PAY-101 @regression', async ({ page }) => {
    await openWallet(page, { balance: 100000, kyc: 'basic', sent: 900000 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '1500.00');

    // Both fail: total ₹1,515.00 > ₹1,000.00, and ₹9,000.00 + ₹1,500.00 = ₹10,500.00 > ₹10,000.00
    await expect(sendMoney.errorMessage).toHaveText('Insufficient balance');
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹1,000.00', balance: 100000, transfers: 0 });
  });

  test('TC-34: amount range is checked before balance @PAY-101 @regression', async ({ page }) => {
    await openWallet(page, { balance: 1000, kyc: 'full' });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '50000.01');

    // Both fail: out of range, and total ₹50,500.02 > ₹10.00. KYC full keeps the limit out of it
    await expect(sendMoney.errorMessage).toHaveText('Amount must be between ₹1 and ₹50,000'); // provisional, Q-2
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹10.00', balance: 1000, transfers: 0 });
  });

  test('TC-35: frozen is checked first @PAY-101 @regression', async ({ page }) => {
    // Provisional on Q-2, Q-10
    await controlClock(page);
    await openWallet(page, { balance: 1000, frozen: true });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '100.00');
    await letLateEffectsLand(page);

    // total ₹102.00 > ₹10.00, so the balance rule would also fail; frozen must win
    await expect(sendMoney.errorMessage).toHaveText(/\S/);
    await expect(sendMoney.errorMessage).not.toHaveText(KNOWN_ERRORS);
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹10.00', balance: 1000, transfers: 0 });
  });

  test('TC-41: frozen is checked before the amount range @PAY-101 @regression', async ({ page }) => {
    // Provisional on Q-2, Q-10
    await controlClock(page);
    await openWallet(page, { frozen: true });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '0.50');
    await letLateEffectsLand(page);

    await expect(sendMoney.errorMessage).toHaveText(/\S/);
    await expect(sendMoney.errorMessage).not.toHaveText(KNOWN_ERRORS);
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹5,000.00', balance: 500000, transfers: 0 });
  });
});
