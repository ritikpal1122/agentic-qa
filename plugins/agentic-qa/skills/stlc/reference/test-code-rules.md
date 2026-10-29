# Test code rules

Used by phase 09 (writing) and phase 10 (review). The project profile wins where it is more specific.

## Assertions

1. **Assert the outcome the case expects, exactly.** Exact text, exact amounts, exact counts. Not `toBeVisible()`
   alone when the case says what the text must be.
2. **Check the effect, not only the message.** After an action that saves or changes data, assert the stored
   result (state, API, database or another screen that shows it). After a rejected action, assert nothing changed.
3. **One behaviour per test.** Several `expect`s are fine if they check the same behaviour.
4. **No assertion that can't fail.** `expect(x).toBeTruthy()` on something always present, or `count >= 0`, proves nothing.
5. **Never weaken an assertion to make a test pass.** If the product disagrees with the expected result, the
   test stays red and the failure is triaged.
6. **Calculated expectations come from the case's working**, written as constants with a comment
   (`// expires = sent 10:00:00 + 30 min = 10:30:00; now 10:30:01 → expired`), not recomputed with the product's formula.

## Locators

1. Use the profile's order. A common default: test id → role with name → label → text. No CSS chains, no XPath, no indexes.
2. **Never guess a locator.** Take it from the product source or the live page, and verify it (phase 09, step 3).
3. One locator per element, defined once in the page object.

## Waiting and stability

1. Web-first assertions and auto-waiting. Never fixed sleeps (`waitForTimeout`, `sleep`).
2. Wait for a state ("success screen visible"), not for time.
   **Proving something did not happen** (no second email, no save on a locked account): first wait for the moment it
   would have happened (the response arrives, the success screen shows, the button re-enables). Only if the app gives
   no such signal, use one short bounded wait in a named helper with a comment saying why, never a bare sleep in a test.
3. Each test sets up its own data through the project's fixtures. No test depends on another test or on order.
4. No real time, randomness or shared accounts in assertions unless controlled by the test.

## Structure

1. Test title starts with the case ID and carries the tags: `TC-7: expired reset link is rejected @AUTH-31`.
2. Steps in the test follow the case's steps, in the same order, so a reviewer can read them side by side.
3. Page objects hold locators and actions only. Assertions live in tests.
4. No secrets in code. Credentials come from the environment or the project's config.
5. No product code changes, no edits to unrelated tests.
