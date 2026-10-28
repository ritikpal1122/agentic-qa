import { test, expect, openWallet, walletState } from '../../fixtures/wallet';
import { SendMoneyPage } from '../../pages/SendMoneyPage';
import { controlClock, letLateEffectsLand } from '../../utils/clock';
import { CONTACT_ID, expectNoTransfer } from './checks';

test.describe('Confirm, send, success', () => {
  test('TC-16: confirm screen shows recipient, amount, fee, total and the send button @PAY-101 @smoke', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '1000.00');

    // Whether the last 4 digits also show is open (G-9), so only the name is checked
    await expect(sendMoney.confirmTo).toContainText('Priya Nair');
    await expect(sendMoney.confirmAmount).toHaveText('₹1,000.00');
    // 1% of ₹1,000.00 = ₹10.00; total ₹1,010.00
    await expect(sendMoney.confirmFee).toHaveText('₹10.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹1,010.00');
    await expect(sendMoney.sendButton).toHaveText('Send ₹1,010.00');
  });

  test('TC-17: no money moves before the user confirms @PAY-101 @regression', async ({ page }) => {
    await controlClock(page);
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '1000.00');
    await expect(sendMoney.sendButton).toBeVisible();
    // Catches a product that sends on its own after a delay
    await letLateEffectsLand(page);

    await expect(sendMoney.sendButton).toBeVisible();
    await expect(sendMoney.moneySent).toBeHidden();
    await expect(sendMoney.balanceChip).toHaveText('Balance ₹5,000.00');
    const state = await walletState(page);
    expect(state.ledger).toHaveLength(0);
    expect(state.balance).toBe(500000);
  });

  test('TC-18: confirmed send shows success, a reference and the new balance @PAY-101 @smoke', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '1000.00');
    await expect(sendMoney.sendButton).toHaveText('Send ₹1,010.00');
    await sendMoney.send();

    await expect(sendMoney.moneySent).toBeVisible();
    await expect(sendMoney.reference).toHaveText(/^Ref: \S+$/);
    // ₹5,000.00 − ₹1,000.00 − ₹10.00 = ₹3,990.00
    await expect(sendMoney.newBalance).toHaveText('New balance ₹3,990.00');

    const state = await walletState(page);
    expect(state.ledger).toHaveLength(1);
    expect(state.ledger[0]).toMatchObject({ to: CONTACT_ID['Priya Nair'], amount: 100000, fee: 1000 });
    await expect(sendMoney.reference).toHaveText(`Ref: ${state.ledger[0].reference}`);
    expect(state.balance).toBe(399000);
  });

  test('TC-19: new balance subtracts the rounded-up fee @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '250.30');
    // fee ₹2.51 (TC-15); total ₹252.81. Soft, so a wrong label doesn't stop the balance check below
    await expect.soft(sendMoney.sendButton).toHaveText('Send ₹252.81');
    await sendMoney.send();

    // ₹5,000.00 − ₹250.30 − ₹2.51 = ₹4,747.19
    await expect(sendMoney.newBalance).toHaveText('New balance ₹4,747.19');
    const state = await walletState(page);
    expect(state.ledger).toHaveLength(1);
    expect(state.balance).toBe(474719); // 500000 − 25030 − 251
  });

  test('TC-20: edit returns to the send form without sending @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '1000.00');
    await sendMoney.edit();

    // Whether contact and amount are kept is open (G-5), not asserted
    await expect(sendMoney.continueButton).toBeVisible();
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹5,000.00', balance: 500000, transfers: 0 });
  });

  test('TC-21: after edit, a changed amount recalculates fee and total @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '1000.00');
    await sendMoney.edit();
    await sendMoney.fillAndContinue('Priya Nair', '2000.00');

    // 1% of ₹2,000.00 = ₹20.00; total ₹2,020.00
    await expect(sendMoney.confirmAmount).toHaveText('₹2,000.00');
    await expect(sendMoney.confirmFee).toHaveText('₹20.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹2,020.00');
    await expect(sendMoney.sendButton).toHaveText('Send ₹2,020.00');
  });

  test('TC-22: after edit, the checks run again on the new amount @PAY-101 @regression', async ({ page }) => {
    await openWallet(page, { balance: 150000 });
    const sendMoney = new SendMoneyPage(page);

    // total ₹1,010.00 ≤ ₹1,500.00, so confirm opens
    await sendMoney.fillAndContinue('Priya Nair', '1000.00');
    await expect(sendMoney.sendButton).toBeVisible();
    await sendMoney.edit();
    // ₹1,600.00 alone exceeds ₹1,500.00, so this doesn't depend on B-2
    await sendMoney.fillAndContinue('Priya Nair', '1600.00');

    await expect(sendMoney.errorMessage).toHaveText('Insufficient balance');
    await expectNoTransfer(page, sendMoney, { chip: 'Balance ₹1,500.00', balance: 150000, transfers: 0 });
  });

  const doubleSends = [
    {
      how: 'mouse',
      // Second click is dispatched directly, so a fixed product that disables or hides Send doesn't break the test;
      // skipped if Send is already gone
      act: async (sendMoney: SendMoneyPage) => {
        await sendMoney.sendButton.click();
        if (await sendMoney.sendButton.isVisible()) await sendMoney.sendButton.dispatchEvent('click');
      },
    },
    {
      how: 'keyboard',
      act: async (sendMoney: SendMoneyPage) => {
        await sendMoney.sendButton.focus();
        await sendMoney.sendButton.page().keyboard.press('Enter');
        await sendMoney.sendButton.page().keyboard.press('Enter');
      },
    },
  ];
  for (const row of doubleSends) {
    test(`TC-36: double send (${row.how}) makes exactly one transfer @PAY-101 @regression`, async ({ page }) => {
      await controlClock(page);
      await openWallet(page);
      const sendMoney = new SendMoneyPage(page);

      await sendMoney.fillAndContinue('Priya Nair', '1000.00');
      await expect(sendMoney.sendButton).toBeVisible();
      await row.act(sendMoney);
      await expect(sendMoney.moneySent).toBeVisible();
      // Covers the click gap plus any send still in flight, so a late second debit is seen
      await letLateEffectsLand(page);

      const state = await walletState(page);
      expect(state.ledger).toHaveLength(1);
      await expect(sendMoney.reference).toHaveText(`Ref: ${state.ledger[0].reference}`);
      // ₹5,000.00 − ₹1,010.00 = ₹3,990.00 (two transfers would give ₹2,980.00)
      await expect(sendMoney.newBalance).toHaveText('New balance ₹3,990.00');
      await expect(sendMoney.errorMessage).toHaveText('');

      await sendMoney.done();
      await letLateEffectsLand(page);

      await expect(sendMoney.continueButton).toBeVisible();
      await expect(sendMoney.moneySent).toBeHidden();
      await expect(sendMoney.balanceChip).toHaveText('Balance ₹3,990.00');
      expect((await walletState(page)).ledger).toHaveLength(1);
    });
  }
});

test.describe('Regression', () => {
  test('TC-37: balance chip shows the new balance after a send @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);
    await expect(sendMoney.balanceChip).toHaveText('Balance ₹5,000.00');

    await sendMoney.fillAndContinue('Priya Nair', '1000.00');
    await expect(sendMoney.sendButton).toHaveText('Send ₹1,010.00');
    await sendMoney.send();
    await sendMoney.done();

    // ₹5,000.00 − ₹1,000.00 − ₹10.00 = ₹3,990.00
    await expect(sendMoney.balanceChip).toHaveText('Balance ₹3,990.00');
    const state = await walletState(page);
    expect(state.ledger).toHaveLength(1);
    expect(state.balance).toBe(399000);
  });

  test('TC-38: done returns to an empty send form, and the next send starts clean @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '100.00');
    await expect(sendMoney.sendButton).toHaveText('Send ₹102.00');
    await sendMoney.send();
    await sendMoney.done();

    // Q-9 default (provisional): empty form
    await expect(sendMoney.continueButton).toBeVisible();
    await expect(sendMoney.moneySent).toBeHidden();
    await expect(sendMoney.sendButton).toBeHidden();
    await expect(sendMoney.contactSelect).toHaveValue('');
    await expect(sendMoney.amountInput).toHaveValue('');
    await expect(sendMoney.continueButton).toBeDisabled();
    const state = await walletState(page);
    expect(state.ledger).toHaveLength(1);
    expect(state.balance).toBe(489800); // 500000 − 10200

    await sendMoney.fillAndContinue('Aman Verma', '300.00');

    // 1% of ₹300.00 = ₹3.00 ≥ ₹2.00; total ₹303.00; ₹5,000.00 − ₹102.00 = ₹4,898.00
    await expect(sendMoney.confirmTo).toContainText('Aman Verma');
    await expect(sendMoney.confirmAmount).toHaveText('₹300.00');
    await expect(sendMoney.confirmFee).toHaveText('₹3.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹303.00');
    await expect(sendMoney.sendButton).toHaveText('Send ₹303.00');
    await expect(sendMoney.balanceChip).toHaveText('Balance ₹4,898.00');
  });

  test('TC-42: a deliberate second identical send still goes through @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '1000.00');
    await expect(sendMoney.sendButton).toHaveText('Send ₹1,010.00');
    await sendMoney.send();
    await expect(sendMoney.newBalance).toHaveText('New balance ₹3,990.00');
    const firstRef = await sendMoney.reference.textContent();
    await sendMoney.done();

    await sendMoney.fillAndContinue('Priya Nair', '1000.00');
    await expect(sendMoney.confirmTotal).toHaveText('₹1,010.00');
    await expect(sendMoney.errorMessage).toHaveText('');
    await expect(sendMoney.sendButton).toHaveText('Send ₹1,010.00');
    await sendMoney.send();

    // ₹5,000.00 − 2 × ₹1,010.00 = ₹2,980.00; daily total ₹2,000.00 ≤ ₹10,000.00
    await expect(sendMoney.moneySent).toBeVisible();
    await expect(sendMoney.newBalance).toHaveText('New balance ₹2,980.00');
    await expect(sendMoney.reference).not.toHaveText(firstRef ?? '');

    const state = await walletState(page);
    expect(state.ledger).toHaveLength(2);
    for (const transfer of state.ledger) {
      expect(transfer).toMatchObject({ to: CONTACT_ID['Priya Nair'], amount: 100000, fee: 1000 });
    }
    expect(state.balance).toBe(298000);
    await sendMoney.done();
    await expect(sendMoney.balanceChip).toHaveText('Balance ₹2,980.00');
  });

  test('TC-45: after edit, a changed contact receives the money @PAY-101 @regression', async ({ page }) => {
    await openWallet(page);
    const sendMoney = new SendMoneyPage(page);

    await sendMoney.fillAndContinue('Priya Nair', '1000.00');
    await sendMoney.edit();
    await sendMoney.fillAndContinue('Kabir Shah', '1000.00');

    await expect(sendMoney.confirmTo).toContainText('Kabir Shah');
    await expect(sendMoney.confirmTo).not.toContainText('Priya Nair');

    await expect(sendMoney.sendButton).toHaveText('Send ₹1,010.00');
    await sendMoney.send();
    // ₹5,000.00 − ₹1,010.00 = ₹3,990.00
    await expect(sendMoney.newBalance).toHaveText('New balance ₹3,990.00');
    const state = await walletState(page);
    expect(state.ledger).toHaveLength(1);
    expect(state.ledger[0]).toMatchObject({ to: CONTACT_ID['Kabir Shah'], amount: 100000, fee: 1000 });
    expect(state.balance).toBe(399000);
  });
});
