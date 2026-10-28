import { test, expect, openWallet, walletState } from '../../fixtures/wallet';
import { SendMoneyPage } from '../../pages/SendMoneyPage';
import { controlClock, letLateEffectsLand } from '../../utils/clock';
import { expectNoTransfer } from './checks';

const RANGE_ERROR = 'Amount must be between ₹1 and ₹50,000'; // provisional, Q-2
const FORMAT_ERROR = 'Enter a valid amount'; // provisional, Q-2

test.describe('Send form', () => {
  test('TC-1: "To" lists only saved contacts, as name + last 4 digits @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    // Contacts are setup data from the demo build, not a spec value
    await expect(sendMoney.contactOptions).toHaveText([/Aman Verma.*3021/, /Priya Nair.*7788/, /Kabir Shah.*1450/]);
    const labels = await sendMoney.contactOptions.allTextContents();
    expect(labels.map((label) => label.replace(/\D/g, ''))).toEqual(['3021', '7788', '1450']);

    expect(await sendMoney.contactSelect.evaluate((el) => el.tagName)).toBe('SELECT');
    await expect(sendMoney.textInputs).toHaveCount(1);
    await expect(sendMoney.textInputs).toHaveAttribute('data-testid', 'amount');
  });

  test('TC-2: continue is disabled until both a contact and an amount are entered @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await expect(sendMoney.continueButton).toBeDisabled();

    await sendMoney.chooseContact('Priya Nair');
    await expect(sendMoney.continueButton).toBeDisabled();

    await sendMoney.clearContact();
    await sendMoney.enterAmount('100.00');
    await expect(sendMoney.continueButton).toBeDisabled();

    await sendMoney.chooseContact('Priya Nair');
    await expect(sendMoney.continueButton).toBeEnabled();
  });

  test('TC-3: balance chip shows the current balance with 2 decimals and Indian grouping @PAY-101 @regression', async ({ page }) => {
    await openWallet(page, { balance: 10000000 });
    const sendMoney = new SendMoneyPage(page);

    await expect(sendMoney.balanceChip).toHaveText('Balance ₹1,00,000.00');
  });
});

test.describe('Amount', () => {
  test('TC-4: minimum amount ₹1.00 is accepted @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '1.00');
    await expect(sendMoney.confirmAmount).toHaveText('₹1.00');
    // fee = max(₹2.00, 1% of ₹1.00 = ₹0.01) = ₹2.00; total ₹3.00
    await expect(sendMoney.confirmFee).toHaveText('₹2.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹3.00');
    await expect(sendMoney.errorMessage).toHaveText('');

    await sendMoney.send();
    // ₹5,000.00 − ₹3.00 = ₹4,997.00
    await expect(sendMoney.newBalance).toHaveText('New balance ₹4,997.00');
    const state = await walletState(page);
    expect(state.ledger).toHaveLength(1);
    expect(state.balance).toBe(499700);
  });

  for (const amount of ['0.99', '0.00']) {
    test(`TC-5: amount ₹${amount} is rejected @PAY-101 @smoke`, async ({ page }) => {
      await openWallet(page);
      const sendMoney = new SendMoneyPage(page);

      await sendMoney.fillAndContinue('Priya Nair', amount);

      await expect(sendMoney.errorMessage).toHaveText(RANGE_ERROR);
      await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹5,000.00', balance: 500000, transfers: 0 });
    });
  }

  test('TC-6: maximum amount ₹50,000.00 is accepted @PAY-101 @regression', async ({ page }) => {
    await openWallet(page, { balance: 20000000, kyc: 'full', sent: 0 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '50000.00');
    // fee = 1% of ₹50,000.00 = ₹500.00 (exact); total ₹50,500.00
    await expect(sendMoney.confirmAmount).toHaveText('₹50,000.00');
    await expect(sendMoney.confirmFee).toHaveText('₹500.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹50,500.00');

    await sendMoney.send();
    // ₹2,00,000.00 − ₹50,500.00 = ₹1,49,500.00
    await expect(sendMoney.newBalance).toHaveText('New balance ₹1,49,500.00');
    const state = await walletState(page);
    expect(state.ledger).toHaveLength(1);
    expect(state.balance).toBe(14950000);
  });

  test('TC-7: amount ₹50,000.01 is rejected @PAY-101 @regression', async ({ page }) => {
    // Balance and the full limit both allow it, so only the range rule can reject it
    await openWallet(page, { balance: 6000000, kyc: 'full', sent: 0 });
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '50000.01');

    await expect(sendMoney.errorMessage).toHaveText(RANGE_ERROR);
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹60,000.00', balance: 6000000, transfers: 0 });
  });

  test('TC-8: amount with 2 decimals is accepted as entered @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '10.25');

    // 1% of ₹10.25 = ₹0.1025 → ₹0.11, below minimum → fee ₹2.00; total ₹12.25
    await expect(sendMoney.confirmAmount).toHaveText('₹10.25');
    await expect(sendMoney.confirmFee).toHaveText('₹2.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹12.25');
  });

  test('TC-9: amount with 3 decimals is rejected, not rounded @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '10.255');

    await expect(sendMoney.errorMessage).toHaveText(FORMAT_ERROR);
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹5,000.00', balance: 500000, transfers: 0 });
  });

  const nonNumeric = [
    { amount: 'abc', error: new RegExp(`^${FORMAT_ERROR}$`) },
    // No source says whether format or range rejects a negative amount
    { amount: '-5.00', error: new RegExp(`^(${FORMAT_ERROR}|${RANGE_ERROR})$`) },
  ];
  for (const row of nonNumeric) {
    test(`TC-10: amount "${row.amount}" is rejected @PAY-101 @regression`, async ({ page }) => {
      await openWallet(page);
      const sendMoney = new SendMoneyPage(page);

      await sendMoney.fillAndContinue('Priya Nair', row.amount);

      await expect(sendMoney.errorMessage).toHaveText(row.error);
      await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹5,000.00', balance: 500000, transfers: 0 });
    });
  }

  // Working per row: fee = max(₹2.00, 1% rounded up); new balance = ₹5,000.00 − total
  const exactAmounts = [
    { entered: '100', amount: '₹100.00', fee: '₹2.00', total: '₹102.00', newBalance: '₹4,898.00', balance: 489800 }, // 1% = ₹1.00 < min
    { entered: '10.5', amount: '₹10.50', fee: '₹2.00', total: '₹12.50', newBalance: '₹4,987.50', balance: 498750 }, // 1% = ₹0.105 → ₹0.11 < min
    { entered: '1.15', amount: '₹1.15', fee: '₹2.00', total: '₹3.15', newBalance: '₹4,996.85', balance: 499685 }, // 1% = ₹0.0115 → ₹0.02 < min
    { entered: '4.35', amount: '₹4.35', fee: '₹2.00', total: '₹6.35', newBalance: '₹4,993.65', balance: 499365 }, // 1% = ₹0.0435 → ₹0.05 < min
  ];
  for (const row of exactAmounts) {
    test(`TC-40: amount "${row.entered}" converts exactly @PAY-101 @regression`, async ({ page }) => {
      await openWallet(page);
      const sendMoney = new SendMoneyPage(page);

      await sendMoney.fillAndContinue('Priya Nair', row.entered);
      await expect(sendMoney.errorMessage).toHaveText('');
      await expect(sendMoney.confirmAmount).toHaveText(row.amount);
      await expect(sendMoney.confirmFee).toHaveText(row.fee);
      await expect(sendMoney.confirmTotal).toHaveText(row.total);

      await sendMoney.send();
      await expect(sendMoney.newBalance).toHaveText(`New balance ${row.newBalance}`);
      expect((await walletState(page)).balance).toBe(row.balance);
    });
  }

  for (const value of ['<img src=x onerror=alert(1)>', 'Infinity', '12345678901234567890']) {
    test(`TC-44: hostile or number-like amount "${value}" is rejected safely @PAY-101 @regression`, async ({ page }) => {
      let dialogOpened = false;
      page.on('dialog', async (dialog) => {
        dialogOpened = true;
        await dialog.dismiss();
      });
      await controlClock(page);
      await openWallet(page);
      const sendMoney = new SendMoneyPage(page);

      await sendMoney.fillAndContinue('Priya Nair', value);
      await letLateEffectsLand(page);

      await expect(sendMoney.errorMessage).toHaveText(new RegExp(`^(${FORMAT_ERROR}|${RANGE_ERROR})$`));
      await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹5,000.00', balance: 500000, transfers: 0 });
      expect(dialogOpened).toBe(false);
      // The page has no images, so any img means the entered text was rendered as markup
      await expect(sendMoney.images).toHaveCount(0);
    });
  }
});
