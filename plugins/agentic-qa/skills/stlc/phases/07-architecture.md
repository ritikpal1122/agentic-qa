# Phase 07: Reuse and architecture

**Goal:** plan exactly which files the build will create or change, reusing what already exists.
Reuse before writing: no duplicate page objects, helpers or setup.

**Reads:** `05-selection.md`, `.stlc/project-profile.md`, the automation repo. **Writes:** `07-architecture.md`.
**Never:** write code yet.

---

## Step 1: Map selected cases to existing code

For each case selected for automation in `05-selection.md`:
- Is it **already automated**? Search tests by ticket key, case title, the flow and its key assertions.
  If an existing test already covers it, mark `covered by <file>:<test>`; don't write a duplicate.
- Which **page objects, fixtures and helpers** can it use as they are?
- What's **missing**: a locator, a page object method, a fixture option, a data builder?

Also map each **regression area** from `05-selection.md` to existing tests (by file and title, or a grep tag).

## Step 2: Plan the new code

Prefer, in order:
1. Use as is.
2. **Extend** an existing building block (add a method to a page object, an option to a fixture),
   if it fits that block's purpose and doesn't change its current behaviour.
3. **Create** a new one, following the profile's conventions (folder, naming, base class).

Never change the behaviour of an existing helper other tests rely on. If one is wrong, write it down for the human.

## Step 3: Write the plan

```markdown
## Files
| Action | File | What | Used by |
|---|---|---|---|
| create | pages/SendMoneyPage.ts | Form, confirm, success screens; actions: chooseContact, enterAmount, continue, send | TC-1..TC-20 |
| extend | fixtures/wallet.ts | (none needed) | |
| create | tests/send-money/send-money.spec.ts | TC-1..TC-20, tagged @PAY-101 | |

## Case map
| Case | Level | Status | Test file | Building blocks |
|---|---|---|---|---|
| TC-7 | E2E | new | tests/send-money/send-money.spec.ts | openWallet, SendMoneyPage, walletState |
| TC-3 | E2E | covered by tests/smoke/app-loads.spec.ts | — | — |

## Locators needed
| Page object | Element | Planned locator | Verified? |
|---|---|---|---|
| SendMoneyPage | Amount input | getByTestId('amount') | not yet (09) |

## Regression run
- <command or grep that runs the regression areas>

## Branch
test/<RUN-ID>-<short-name>
```

Planned locators come from the product source or the live app, never from guesses. Phase 09 verifies them.

## Step 4: Finish

Header: `Inputs: 05-selection.md, 06-codebase.md`, `Status: draft`. Summary: files to create and change,
cases already covered, reuse count. Continue to 08 (the approval covers this plan).

## Done when

- [ ] Every selected case is mapped: new, or covered by an existing test
- [ ] Every new file follows the profile's conventions
- [ ] Existing blocks are reused or extended before anything is created
- [ ] Regression areas are mapped to a runnable selection
