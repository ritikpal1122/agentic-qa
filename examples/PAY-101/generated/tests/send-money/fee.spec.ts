import { test, expect, openWallet } from '../../fixtures/wallet';
import { SendMoneyPage } from '../../pages/SendMoneyPage';

test.describe('Fee', () => {
  test('TC-11: fee is 1% of the amount @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '1000.00');

    // 1% of ₹1,000.00 = ₹10.00 (not 1.5% = ₹15.00); total ₹1,010.00
    await expect(sendMoney.confirmFee).toHaveText('₹10.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹1,010.00');
  });

  const minimumFee = [
    { amount: '150.00', fee: '₹2.00', total: '₹152.00' }, // 1% = ₹1.50 < ₹2.00 → ₹2.00
    { amount: '199.99', fee: '₹2.00', total: '₹201.99' }, // 1% = ₹1.9999 → rounded up ₹2.00 = minimum
  ];
  for (const row of minimumFee) {
    test(`TC-12: fee minimum ₹2.00 applies to ₹${row.amount} @PAY-101 @regression`, async ({ page }) => {
      await openWallet(page);
      const sendMoney = new SendMoneyPage(page);

      await sendMoney.fillAndContinue('Priya Nair', row.amount);

      await expect(sendMoney.confirmFee).toHaveText(row.fee);
      await expect(sendMoney.confirmTotal).toHaveText(row.total);
    });
  }

  test('TC-13: fee at the switch point ₹200.00 @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '200.00');

    // 1% of ₹200.00 = ₹2.00 = minimum; total ₹202.00
    await expect(sendMoney.confirmFee).toHaveText('₹2.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹202.00');
  });

  test('TC-14: fee just above the switch point rounds up @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '200.01');

    // 1% of ₹200.01 = ₹2.0001 → rounded up ₹2.01; total ₹200.01 + ₹2.01 = ₹202.02
    await expect(sendMoney.confirmFee).toHaveText('₹2.01');
    await expect(sendMoney.confirmTotal).toHaveText('₹202.02');
  });

  test('TC-15: fee with a fraction under half a paisa rounds up @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '250.30');

    // 1% of ₹250.30 = ₹2.503 → rounded up ₹2.51; total ₹250.30 + ₹2.51 = ₹252.81
    await expect(sendMoney.confirmFee).toHaveText('₹2.51');
    await expect(sendMoney.confirmTotal).toHaveText('₹252.81');
  });

  // Every 1% here is already a whole paisa, so rounding up must not add one
  const exactFees = [
    { amount: '700.00', fee: '₹7.00', total: '₹707.00' },
    { amount: '1234.00', fee: '₹12.34', total: '₹1,246.34' },
    { amount: '5700.00', fee: '₹57.00', total: '₹5,757.00' },
    { amount: '12345.00', fee: '₹123.45', total: '₹12,468.45' },
    { amount: '49999.00', fee: '₹499.99', total: '₹50,498.99' },
  ];
  for (const row of exactFees) {
    test(`TC-39: exact 1% fee on ₹${row.amount} gets no extra paisa @PAY-101 @regression`, async ({ page }) => {
      // Totals ≤ ₹60,000.00 balance and amounts ≤ the ₹1,00,000.00 full limit, so only the fee is under test
      await openWallet(page, { balance: 6000000, kyc: 'full', sent: 0 });
      const sendMoney = new SendMoneyPage(page);

      await sendMoney.fillAndContinue('Priya Nair', row.amount);

      await expect(sendMoney.confirmFee).toHaveText(row.fee);
      await expect(sendMoney.confirmTotal).toHaveText(row.total);
    });
  }
});
