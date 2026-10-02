# Trip Splitter — Build Plan

Spec + execution plan for the Frontend Intern take-home. Written so you (or a coding assistant) can follow it top to bottom.
**Principle:** correctness and clean typing beat feature count. Do the money logic first, UI second.

---

## 0. Working rules

1. Build **bottom-up**: domain (pure TS) → tests → Redux → UI → polish.
2. Commit small, in the order of Section 12. Commit messages: `feat: …`, `test: …`, `chore: …`. A clean history is read by reviewers.
3. After every milestone run `npm run typecheck && npm run lint && npm run test`. Never let them stay red.
4. **No** `any`, `@ts-ignore`, `@ts-expect-error`. Avoid `as` and `!`. If one is unavoidable, add a one-line comment explaining why. (Lint will enforce this, Section 3.)
5. **No** form/validation libs (RHF, Formik, Zod, Yup) and **no** component libs (MUI, AntD, Chakra).
6. Money is **integer paise everywhere**. No floats in logic, ever.
7. Understand every line. You will be asked to explain it in the interview.

---

## 1. Requirement traceability (tick each at the end)

| # | Requirement | Where it is satisfied |
|---|---|---|
| 1 | Navbar: Expenses `/`, Add expense `/expenses/new`, active link visibly marked | `Navbar.tsx` using `NavLink` (`end` on `/`) + CSS for `.active` / `[aria-current="page"]` |
| 2 | Unknown URL → "Page not found" + link to Expenses | `NotFoundPage.tsx`, route `path="*"` |
| 3 | Add form fields: description, amount, paid by, date, category, split (3 types) | `AddExpenseForm.tsx` |
| 4 | Save → add → go to Expenses with "added" message; Cancel → back, no save | form submit handler + flash message |
| 5 | Balance per member: "gets back ₹X" / "owes ₹X" / "settled up" | `BalanceSummary.tsx` |
| 6 | Table sorted newest first; columns Date, Description, Category, Paid by, Amount, Split | `ExpenseTable.tsx` + `selectors.ts` |
| 7 | Category filter + total of shown expenses | `CategoryFilter.tsx`, `selectVisibleExpenses`, total row |
| 8 | Delete with confirm; balances update instantly | `ConfirmDialog.tsx` + `deleteExpense` + memoised selector |
| 9 | Empty states: no expenses / none in category | `EmptyState.tsx` (two variants) |
| 10 | Validation: all rules, error next to every failing field, nothing saved on error | `domain/validation.ts` + field error rendering |
| 11 | Money rules: balances formula, payer need not be in split, no lost paisa, balances sum to ₹0 | `domain/split.ts`, `domain/balances.ts`, property tests |
| 12 | Indian format `₹1,00,000.00` everywhere | `domain/money.ts › formatINR` (only place that formats) |
| 13 | Sample data copied to `src/data/sample-data.json`; persisted in localStorage; fallback on missing/corrupt | `persistence.ts`, `domain/guards.ts` |
| 14 | Strict TS, `npm run typecheck` zero errors | `tsconfig.json` |
| 15 | Redux Toolkit + typed hooks | `app/store.ts`, `app/hooks.ts` |
| 16 | Logic outside components, testable without React | everything in `src/domain` |
| 17 | Tests: split/balance (incl. ₹100 ÷ 3) + form (errors & valid save) | Section 10 |
| 18 | ESLint + typescript-eslint, `npm run lint` passes | `eslint.config.js` |
| 19 | Responsive to 360 px | Section 9 |
| 20 | Accessible basics: visible labels, errors next to fields, keyboard | Section 8 |
| 21 | Scripts: `dev, build, typecheck, lint, test` | `package.json` |
| 22 | README ≤ ~500 words, 4 required parts | Section 14 |

---

## 2. Setup

```bash
npm create vite@latest trip-splitter -- --template react-ts
cd trip-splitter
npm install
npm install @reduxjs/toolkit react-redux react-router-dom
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  eslint-plugin-jsx-a11y
```

(The Vite template already ships ESLint + typescript-eslint + react-hooks plugins; verify and keep them.)

Copy the provided sample JSON to `src/data/sample-data.json` **verbatim**.

### `package.json` scripts
```json
"dev": "vite",
"build": "tsc --noEmit && vite build",
"typecheck": "tsc --noEmit",
"lint": "eslint .",
"test": "vitest run"
```
Optionally also `"test:watch": "vitest"`.

### `tsconfig.json` — use ONE simple file so `"strict": true` is obvious to a reviewer
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts"]
}
```
`noUncheckedIndexedAccess` makes `record[id]` typed `number | undefined` → forces `?? 0`, which kills a whole class of bugs. Remove the template's `tsconfig.app.json` / `tsconfig.node.json` split (or make sure `typecheck` still covers `src`).

### `vite.config.ts`
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

### `src/test/setup.ts`
- `import '@testing-library/jest-dom/vitest';`
- Polyfill `HTMLDialogElement.prototype.showModal` / `close` (jsdom lacks them) — set `open` attribute / remove it.
- `afterEach(() => localStorage.clear())`.

### ESLint (`eslint.config.js`, flat config)
Use `tseslint.configs.recommendedTypeChecked` (or `strictTypeChecked`) with `parserOptions.projectService: true`, plus `react-hooks`, `react-refresh`, `jsx-a11y` recommended. Add these explicit rules so the "no any / casts / non-null" requirement is **machine-enforced**:
```js
'@typescript-eslint/no-explicit-any': 'error',
'@typescript-eslint/ban-ts-comment': 'error',
'@typescript-eslint/no-non-null-assertion': 'error',
'@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }], // `as const` still allowed
```
If a legit exception is needed, use a line-level `eslint-disable-next-line` **with a reason comment**. Aim for zero exceptions.

---

## 3. Folder structure

```
src/
  main.tsx                 # mounts Provider + BrowserRouter
  App.tsx                  # layout + <Routes>
  app/
    store.ts               # setupStore(preloaded?) factory, RootState, AppDispatch
    hooks.ts               # useAppDispatch, useAppSelector (typed)
    persistence.ts         # load/save localStorage (+ subscribe)
  data/
    sample-data.json
  domain/                  # PURE TS — no React, no Redux imports
    types.ts
    money.ts               # parse + format paise/percent
    split.ts               # allocate + computeShares
    balances.ts            # computeBalances, balanceStatus
    validation.ts          # validateExpenseDraft
    guards.ts              # parse unknown → typed state (no casts)
    dates.ts               # todayISO, isValidISODate, isFutureDate
    describe.ts            # describeSplit → "Equally, 4 people"
  features/
    expenses/
      expensesSlice.ts     # addExpense, deleteExpense
      membersSlice.ts
      selectors.ts         # memoised selectors
  components/
    Navbar.tsx
    ConfirmDialog.tsx
    EmptyState.tsx
    FormField.tsx          # label + control + error wiring
  pages/
    ExpensesPage/          # BalanceSummary, CategoryFilter, ExpenseTable
    AddExpensePage/        # AddExpenseForm, SplitEditor, formReducer.ts
    NotFoundPage.tsx
  styles/                  # tokens.css, base.css, + per-component css
  test/
    setup.ts, renderWithProviders.tsx, fixtures.ts
```

Each domain file gets a sibling `*.test.ts`.

---

## 4. Domain model (`domain/types.ts`)

```ts
export type MemberId = string;
export type Paise = number; // integer paise; alias for readability (branding would need casts)

export interface Member { id: MemberId; name: string }

export const CATEGORIES = ['Food', 'Travel', 'Stay', 'Activities', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface EqualSplit   { type: 'equal';   memberIds: MemberId[] }
export interface ExactSplit   { type: 'exact';   shares: Record<MemberId, Paise> }
export interface PercentSplit { type: 'percent'; shares: Record<MemberId, number> } // percent, ≤2 decimals
export type Split = EqualSplit | ExactSplit | PercentSplit;

export interface Expense {
  id: string;
  description: string;
  amount: Paise;
  paidBy: MemberId;
  date: string;        // YYYY-MM-DD
  category: Category;
  split: Split;
}
export type NewExpense = Omit<Expense, 'id'>;
```
Also: `export function assertNever(x: never): never` for exhaustive `switch (split.type)`. Never use `default:` fall-through without it.

`isCategory(v: unknown): v is Category` implemented with `CATEGORIES.some((c) => c === v)` (not `includes`, which fights the readonly tuple type).

---

## 5. Money rules (`domain/money.ts`, `domain/split.ts`)

### 5.1 Parsing — string → integer, **no floats**
`parseRupees(input: string): MoneyParse` returning a discriminated union:
`{ ok: true; paise: number } | { ok: false; reason: 'empty' | 'invalid' | 'too-many-decimals' | 'negative' }`

- Trim. Empty → `empty`.
- `/^-\s*\d*\.?\d+$/` → `negative` (so `-5` → "Amount must be more than ₹0").
- Valid pattern: `/^\d+(\.\d+)?$/` (also allow `.5`? → decide: reject; keep strict) then split on `.`; decimals > 2 → `too-many-decimals`.
- `paise = Number(intPart) * 100 + Number(decPart.padEnd(2, '0'))`. Integer arithmetic only.
- Do **not** use `Number(str)` / `parseFloat` for the amount (`Number('') === 0`, `parseFloat('12abc') === 12`).

`parsePercent(input): { ok: true; basisPoints: number } | { ok: false; reason }` — same technique, 0–100, ≤2 decimals, returns **basis points** (percent × 100, integer). 33.33 → 3333, 100 → 10000.

For loaded data where percent is a `number` (e.g. 33.33): `percentToBasisPoints(p) = Math.round(p * 100)`.

Constants: `MAX_AMOUNT_PAISE = 100_000_000` (₹10,00,000).

### 5.2 Formatting — Indian grouping
`formatINR(paise: number): string`
- `sign = paise < 0 ? '-' : ''`, work on `abs`.
- `rupees = Math.trunc(abs / 100)`, `paisa = abs % 100` → pad to 2 digits.
- Group rupees Indian style: last 3 digits, then groups of 2. Write `groupIndian(digits: string)` yourself (don't depend on ICU data being present in CI): 
  `1000000 → "10,00,000"`, `100000 → "1,00,000"`, `999 → "999"`.
- Output `₹1,00,000.00`, `₹0.00`, `₹1,250.50`. Balances show `formatINR(Math.abs(b))` with the words "gets back"/"owes", so the minus sign is only for edge display.
- This is the **only** function that formats money. Never `toFixed`/`toLocaleString` in components.

### 5.3 The paisa rule (state this in README)
> **Largest-remainder method; ties broken by the order of members in the trip list (Aarav, Diya, Kabir, Meera, Rohan).** Used for equal and percentage splits alike. Exact splits need no rounding.

One function does it all:
```ts
// weights are non-negative integers. returns Record<id, paise>, sum === total, always.
allocate(total: Paise, weights: ReadonlyArray<{ id: MemberId; weight: number }>): Record<MemberId, Paise>
```
Algorithm: `totalWeight = Σ weight`; for each: `base = floor(total * weight / totalWeight)`, `rem = (total * weight) % totalWeight`. `leftover = total − Σ base`. Give +1 paisa to the `leftover` members with the largest `rem`; ties → earlier in member order. (Use integer ops only; max product ≈ 1e8 × 1e4 = 1e12, safely < 2^53.)

- Equal: weights all `1`. ₹100 ÷ 3 → 10000 paise → `3334, 3333, 3333` ✓ (first member in trip order gets the extra paisa).
- Percent: weights = basis points.
- `computeShares(expense, memberOrder): Record<MemberId, Paise>`:
  - `equal`: participants = `memberOrder.filter(id => memberIds.includes(id))` (**trip order, not click order**).
  - `exact`: return shares as-is.
  - `percent`: `allocate(amount, entries ordered by memberOrder)`.
  - Use `assertNever` in the switch.

### 5.4 Balances (`domain/balances.ts`)
```ts
computeBalances(members, expenses): Record<MemberId, Paise>
// start every member at 0; paidBy += amount; each share: member −= share
```
`balanceStatus(b)`: `> 0 → 'gets-back'`, `< 0 → 'owes'`, `0 → 'settled'`.
Invariant: `Σ balances === 0` — assert it in tests (and optionally `console.assert`-free: just test).

### 5.5 Golden numbers for the sample data (use as a test!)
Computed with the rule above:

| Member | Balance (paise) | Display |
|---|---|---|
| Aarav (m1) | +1,855,420 | gets back ₹18,554.20 |
| Diya (m2) | −369,578 | owes ₹3,695.78 |
| Kabir (m3) | +55,408 | gets back ₹554.08 |
| Meera (m4) | −811,250 | owes ₹8,112.50 |
| Rohan (m5) | −730,000 | owes ₹7,300.00 |

Sum = 0. Expense totals: 4,224,999 paise (₹42,249.99). Cross-check by hand once; if your code disagrees, trust the algorithm only after you find out why. Notable cases: **e5** (₹1,000 ÷ 3 → m1 gets the extra paisa) and **e6** (₹1,499.99 at 33.33/33.33/33.34 → `49995, 49995, 50009`).

---

## 6. Validation (`domain/validation.ts`)

Pure function, no React:
```ts
interface ExpenseDraft {            // everything is a string, as typed by the user
  description: string; amount: string; paidBy: string; date: string; category: string;
  splitType: 'equal' | 'exact' | 'percent';
  equalMemberIds: MemberId[];
  exactShares: Record<MemberId, string>;
  percentShares: Record<MemberId, string>;
}
interface FormErrors {
  description?: string; amount?: string; paidBy?: string; date?: string; category?: string;
  split?: string;                               // group-level (e.g. "₹12.50 left to assign")
  shares?: Record<MemberId, string>;            // per-member input errors
}
type ValidationResult = { ok: true; value: NewExpense } | { ok: false; errors: FormErrors };

validateExpenseDraft(draft, ctx: { members: Member[]; today: string }): ValidationResult
```
`ok: true` carries the fully-typed `NewExpense`, so the component never builds an expense itself (no casts).

**Collect all errors** (don't stop at the first) so every failing field shows an error. Only the **active** split type is validated; keep the other types' inputs in the draft so switching tabs doesn't lose data.

| Field | Rule | Message |
|---|---|---|
| description | trim, required | "Description is required" |
| | > 60 chars | "Description must be 60 characters or fewer" |
| amount | empty | "Amount is required" |
| | not a number | "Enter a valid amount" |
| | negative or 0 | "Amount must be more than ₹0" |
| | > ₹10,00,000 | "Amount must be ₹10,00,000 or less" |
| | > 2 decimals | "Use at most 2 decimal places" |
| paidBy | empty / not a member | "Select who paid" |
| date | empty | "Date is required" |
| | not a real calendar date | "Enter a valid date" |
| | after today | "Date cannot be in the future" |
| category | not one of 5 | "Select a category" |
| equal | none selected | "Select at least one member" |
| exact | each input blank=₹0 ok; invalid/negative/>2 decimals | per-member error, e.g. "Enter ₹0 or more, up to 2 decimals" |
| | sum ≠ amount | `"₹12.50 left to assign"` / `"₹12.50 over"` (use `formatINR` on the difference). Only when the amount itself is valid |
| percent | each outside 0–100 or >2 decimals | per-member error |
| | sum ≠ 100 | "Percentages must add up to 100 (currently 90, 10 left)" — compute from basis points, format with ≤2 decimals |

Notes:
- Amount valid is a precondition for the exact-sum check; if amount invalid, skip the "left/over" message (no fake numbers).
- Blank share inputs count as 0. On save, store only members with share **> 0** (like the sample data). Describe split as "Exact amounts, N people" using that count.
- `dates.ts`: `todayISO(now = new Date())` must build the string from **local** `getFullYear/getMonth/getDate` — **not** `toISOString()` (UTC; wrong before 5:30 AM IST). `isValidISODate` checks regex **and** round-trips through `Date` (rejects `2026-02-30`). Compare dates as strings (ISO sorts lexicographically).
- Inject `today` into validation → tests are deterministic.

---

## 7. Redux + persistence

### Slices
- `membersSlice`: state `Member[]`, no reducers (empty `reducers: {}`) — it is data.
- `expensesSlice`: state `Expense[]`.
  - `addExpense`: use the `prepare` callback to generate the id (`crypto.randomUUID()` with a small fallback) so the reducer stays pure. Payload type `NewExpense`.
  - `deleteExpense(id: string)`.
- Typed hooks in `app/hooks.ts`: `useAppDispatch = useDispatch.withTypes<AppDispatch>()`, `useAppSelector = useSelector.withTypes<RootState>()`.
- `setupStore(preloadedState?)` factory (tests create fresh stores). Export `RootState = ReturnType<typeof store.getState>` from the factory's return type.

### Selectors (`createSelector`, memoised)
- `selectMembers`, `selectExpenses`
- `selectBalances = createSelector([selectMembers, selectExpenses], computeBalances)`
- `selectVisibleExpenses(state, category | 'All')` → filtered + sorted. **Copy before sorting** (`[...arr].sort`) — state is frozen by Immer, `.sort` in place throws. Sort: date descending, ties → most recently added first.
- `selectTotal` for visible rows: sum of paise.

### Persistence (`app/persistence.ts`) — and the README decision
- Key: `trip-splitter:v1`.
- `loadState(storage = localStorage): PersistedState` → `try { JSON.parse(getItem) } catch → fallback`. Validate with `parsePersistedState(unknown)` from `domain/guards.ts`; null → fallback to sample.
- **Sample data typing trick (no casts):** `import sample from '../data/sample-data.json'` widens `type` to `string`. So pass the JSON through the **same** `parsePersistedState(sample)` guard; throw if it somehow fails (dev error). One code path for sample and stored data.
- `guards.ts`: write `isRecord(v: unknown): v is Record<string, unknown>` then narrow field by field (`typeof`, `Array.isArray`, `isCategory`). Validate: members have string id/name; expenses have integer positive `amount`; `paidBy` is a known member; date is a valid ISO string; split shape valid **and** consistent (exact shares sum = amount; percent sums to 100; equal non-empty; all ids are members). Any failure → whole state invalid → sample data (don't half-load).
- `saveState` in `try/catch` (quota / private mode → silently ignore, app still works in memory).
- Wire in `main.tsx`: `store.subscribe(() => saveState(store.getState()))`, only writing when `expenses` reference changed (cheap guard). **Why here:** reducers stay pure; components don't know storage exists; one place to change if you swap to IndexedDB/backend.

---

## 8. UI spec

### Routing
```tsx
<Routes>
  <Route element={<Layout />}>               {/* Navbar + <main> + <Outlet/> */}
    <Route index element={<ExpensesPage />} />
    <Route path="expenses/new" element={<AddExpensePage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route>
</Routes>
```
`main.tsx` wraps in `<BrowserRouter>`; tests use `MemoryRouter`.

### Navbar
`NavLink to="/" end` and `NavLink to="/expenses/new"`. `NavLink` sets `aria-current="page"` automatically. Style the active link with **more than colour** (underline/border + weight) so it's visible to everyone.

### Add expense form (`AddExpenseForm.tsx`)
- `<form noValidate onSubmit>`; every control has a real `<label htmlFor>`.
- State: `useReducer` with a typed action union (`field`, `toggleMember`, `setShare`, `setSplitType`). Draft is UI-local; Redux only receives the validated result. **Errors are derived**, not stored: `const result = validateExpenseDraft(draft, ctx); const errors = submitted && !result.ok ? result.errors : {}` — once `submitted` is true, errors update live as the user fixes fields, and there is no sync bug.
- Fields:
  - Description: `type="text"`. **No `maxLength` attribute** — otherwise the 60-char error can never show. Optional "n/60" counter.
  - Amount: `type="text" inputMode="decimal"` (not `type="number"` — number inputs hide invalid text, mangle decimals and break the raw-string validation). Label "Amount (₹)".
  - Paid by: `<select>` with placeholder "Select member".
  - Date: `type="date"`, `max={today}`, default today.
  - Category: `<select>` with placeholder.
  - Split type: `<fieldset><legend>Split</legend>` with 3 radios.
  - Equal: `<fieldset>` of checkboxes (default all checked). Exact/Percent: one labelled input per member ("Aarav — amount (₹)", "Aarav — percent (%)").
- Under the split group show the group-level error (`errors.split`) and per-member errors beside each input.
- Each error: `<p id="amount-error" role="alert"?>` — prefer plain `<p id>` + `aria-invalid="true"` + `aria-describedby` on the control. On failed submit, **focus the first invalid control**.
- On valid submit: `dispatch(addExpense(result.value))` → `navigate('/', { state: { flash: 'Expense added' } })`.
- Cancel: `<button type="button">` → `navigate(-1)` if there is history (`location.key !== 'default'`), else `navigate('/')`. Nothing dispatched.
- Optional stretch: live helper under exact/percent "Assigned ₹X of ₹Y" (`aria-live="polite"`), separate from the error.

### Expenses page
- Flash message: read `location.state` (type is `unknown` → narrow with a guard `hasFlash(state)`), keep in `useState` initialiser, show in `role="status"` banner (dismissible), then `navigate(pathname, { replace: true, state: null })` in an effect so a reload doesn't show it again.
- `BalanceSummary`: list of 5 members, each "Aarav — gets back ₹18,554.20" / "owes ₹…" / "settled up". Don't rely on colour alone (text already carries meaning; colour is a bonus).
- `CategoryFilter`: `<label>` + `<select>` with "All" + categories. Filter is local `useState`.
- `ExpenseTable`: semantic `<table>` with visually-hidden `<caption>`, `<th scope="col">`, amount column right-aligned. Paid by shows the **name** (lookup via member map). Split column uses `describeSplit`: `"Equally, 4 people"`, `"Exact amounts, 3 people"`, `"By percentage, 3 people"` (singular: "1 person").
- Footer / summary line: "Total (Food): ₹…" or "Total: ₹…" — sum of the **currently shown** rows.
- Delete button per row: text "Delete" + `aria-label="Delete Villa booking"`. Opens `ConfirmDialog` (native `<dialog>` + `showModal()` → focus trap and Esc for free). Buttons "Cancel" / "Delete". Confirm dispatches `deleteExpense`; balances (selector) update immediately.
- Empty states (`EmptyState`):
  - no expenses at all: "No expenses yet" + link "Add the first expense".
  - none in chosen category: "No expenses in Food" + button "Show all".
  (Balances still render — everyone "settled up".)

### Not found
`<h1>Page not found</h1>` + `<Link to="/">Back to Expenses</Link>`.

---

## 9. Styling & responsive

- Plain CSS with custom properties (`--space-*`, `--color-*`, `--radius`) in `tokens.css`. Mobile-first, `rem` units, `box-sizing: border-box`, `max-width` container.
- Test at **360 px** (DevTools) — no horizontal page scroll.
- Table: wrap in `<div class="table-scroll" tabindex="0" role="region" aria-label="Expenses table">` with `overflow-x: auto` (keyboard-scrollable). Set `th`/`td` `white-space: nowrap` except description.
- Form: single column on mobile; two columns ≥ 640 px for short fields.
- Navbar wraps gracefully; tap targets ≥ 44 px.
- Visible `:focus-visible` outline on everything interactive. Respect `prefers-reduced-motion` (no animations needed anyway).

## 10. Accessibility checklist
- [ ] Every input/select has a visible `<label>`; groups use `fieldset`/`legend`.
- [ ] Errors adjacent to their field, linked with `aria-describedby`, `aria-invalid` set.
- [ ] First invalid field focused on failed submit.
- [ ] Whole app usable by keyboard only (tab order natural, dialog traps focus, Esc closes).
- [ ] One `<h1>` per page, `<main>` landmark, `<nav aria-label="Main">`.
- [ ] Colour contrast ≥ 4.5:1; status never colour-only.
- [ ] Skip link (optional) and `document.title` per page (optional).
- [ ] `eslint-plugin-jsx-a11y` clean.

---

## 11. Tests (Vitest + RTL + user-event)

Prefer **table-driven** tests and role/label queries (`getByRole`, `getByLabelText`) — it also proves accessibility.

### Domain (no React)
**`money.test.ts`**
- `parseRupees`: `"1250.50" → 125050`, `"12" → 1200`, `"12.5" → 1250`, `"0.05" → 5`, `""` empty, `"abc"` invalid, `"-5"` negative, `"1.234"` too-many-decimals, `"12abc"` invalid, `" 7 "` → 700.
- `formatINR`: `0 → ₹0.00`, `5 → ₹0.05`, `125050 → ₹1,250.50`, `10000000 → ₹1,00,000.00`, `100000000 → ₹10,00,000.00`, `99999 → ₹999.99`.
- `parsePercent`: `"33.33"`, `"100"`, `"100.01"` fails, `"-1"` fails, `"12.345"` fails.

**`split.test.ts`**
- **₹100 ÷ 3 → `[3334, 3333, 3333]`** (explicit, named test).
- Equal: extra paisa goes by trip order even if user selected members in a different order.
- Percent: e6 → `{m1: 49995, m2: 49995, m3: 50009}`.
- Exact passthrough.
- Property loop (deterministic LCG or fixed list, no randomness flakiness): for amounts 1…500 and n in 1…7 → `Σ shares === amount`, and max − min ≤ 1.
- Payer not in split is handled by balances (below).

**`balances.test.ts`**
- Sample data → golden table from §5.5 (assert exact paise).
- `Σ balances === 0` for sample + generated cases.
- Payer not in the split gets `+amount`, others negative.
- Settled up when paid === share.
- Delete an expense → balances recomputed.

**`validation.test.ts`** — one case per row of the §6 table, using a fixed `today = '2026-04-01'`. Include: `-5` → "Amount must be more than ₹0"; `10,00,000.01` too big; date tomorrow rejected, today accepted; exact sum short by 1250 → `"₹12.50 left to assign"`; exact over → "over"; percent 99.99 fails, 100 ok; multiple errors reported together; valid draft returns correct `NewExpense` (paise, only >0 shares).

**`guards.test.ts` / `persistence.test.ts`** (fake `Storage` object)
- Empty storage → sample data.
- Invalid JSON → sample data.
- Valid JSON wrong shape (e.g. exact shares not summing) → sample data.
- Round trip save → load equal.
- `setItem` throwing doesn't crash.

**`expensesSlice.test.ts`** — add (id generated, appended), delete.

### Components
**`AddExpenseForm.test.tsx`** (render with real store + `MemoryRouter` + a stub route for `/` that shows the flash)
1. Submit empty form → errors for description, amount, paid by, category (date defaults today) visible **next to fields**; store expenses length unchanged.
2. Amount `-5` → "Amount must be more than ₹0".
3. Description of 61 chars → length error.
4. Exact split with sum short → "₹12.50 left to assign"; nothing saved.
5. Percent not totalling 100 → error; nothing saved.
6. Equal with all unchecked → "Select at least one member".
7. Valid input (equal) → store has the new expense with correct paise/ids, lands on `/`, flash "Expense added" shown.
8. Valid exact and percent saves.
9. Cancel → nothing saved.
10. Errors clear as the user corrects fields (derived-errors design).

**`ExpensesPage.test.tsx`**: balances text for sample data; rows sorted newest first; filter by category updates rows + total; delete → dialog → confirm → row gone + balances change; cancel keeps row; both empty states.

**`App.test.tsx`**: navbar marks active link (`aria-current`); unknown URL → "Page not found" + working link.

Coverage isn't graded, but every row in §1 should have at least one test.

---

## 12. Build order (milestones & commits)

1. `chore: scaffold vite react-ts, strict tsconfig, eslint rules, vitest` → run all 3 scripts green on an empty app.
2. `feat(domain): types + money parse/format` + tests.
3. `feat(domain): allocate/computeShares` + tests (₹100 ÷ 3 first).
4. `feat(domain): balances` + golden tests.
5. `feat(domain): dates + validation` + tests.
6. `feat(domain): guards + persistence` + tests.
7. `feat(store): slices, selectors, typed hooks, subscribe-to-persist`.
8. `feat(ui): layout, navbar, 404, routing` + test.
9. `feat(ui): expenses page (balances, table, filter, total, empty states)` + tests.
10. `feat(ui): delete with confirm dialog` + tests.
11. `feat(ui): add-expense form` + tests.
12. `style: responsive 360px, focus styles, polish`.
13. `docs: README` and final QA (Section 13).

If time runs short, stop after 11 and say what is missing in the README — "unfinished is fine if documented".

---

## 13. Pitfalls (the usual ways these assignments lose marks)

- ❌ Floats for money, `toFixed`, `Math.round(x * 100)` on user text. ✅ String → integer paise.
- ❌ `new Date().toISOString().slice(0, 10)` for "today" (UTC, off by a day in IST mornings).
- ❌ `type="number"` for amount; `maxLength` on description.
- ❌ `Number('') === 0` passing the "required" check.
- ❌ Sorting selector output in place (Immer-frozen state throws).
- ❌ Storing derived data (balances, totals) in Redux. Derive via selectors.
- ❌ Components containing split/validation maths.
- ❌ Extra paisa depends on click order — must depend on trip order.
- ❌ Missing `key` props / using array index as key for expenses (use `id`).
- ❌ Reading `localStorage` inside components or reducers.
- ❌ Not handling payer outside the split, or percent shares with floats like 33.33 summing to 99.99999.
- ❌ Suppressing lint with blanket `eslint-disable`.
- ❌ Dead code, `console.log`, commented-out blocks, unused deps.

---

## 14. README skeleton (≤ ~500 words — count them)

```md
# Trip Splitter

## Run it
npm install
npm run dev
Other scripts: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
**Not finished / known gaps:** <be honest; "nothing" if complete>

## Rounding rule
Largest-remainder method, ties broken by trip member order (Aarav → Rohan).
₹100 ÷ 3 = ₹33.34 / ₹33.33 / ₹33.33. Same rule for equal and percentage splits.

## Three decisions
1. **Money as integer paise + one `allocate` function.** <why: no float errors, one rounding rule, easy to test>
2. **Form draft is local (`useReducer`), errors are derived from a pure `validateExpenseDraft`.** <why: Redux only sees valid data; no stale errors; testable without React>
3. **localStorage lives in `persistence.ts`, wired by `store.subscribe` in `main.tsx`; loaded data goes through a type guard.** <why: reducers pure, components unaware, corrupt data falls back to sample data, no casts>

## With another day
<3–4 specifics, e.g. "settle-up suggestions (who pays whom)", "edit expense", "category filter in URL", "cross-tab sync via storage event", "e2e test with Playwright">

## AI tools
<2–3 honest sentences: which tool, what you used it for (e.g. planning, test ideas, reviewing), and that you read, understood and verified all code.>
```
Write this last, in your own words. Keep the AI note truthful and specific.

---

## 15. Final QA checklist

- [ ] Fresh clone → `npm install && npm run dev` works.
- [ ] `npm run typecheck`, `lint`, `test`, `build` all pass with **zero** errors/warnings.
- [ ] `grep -rnE "\bany\b|@ts-ignore|@ts-expect-error" src` → nothing (outside comments); any `as`/`!` has a reason comment.
- [ ] Sample data loads on first visit; reload keeps changes; clearing storage or corrupting the JSON restores sample data.
- [ ] Balances match §5.5 on first load and always sum to ₹0.
- [ ] Every amount shown via `formatINR` (search for `toFixed|toLocaleString|₹` in components).
- [ ] All validation cases from §6 manually tried; nothing saved on error.
- [ ] Add → redirected with message; Cancel → back; Delete → confirm → balances update.
- [ ] Both empty states reachable.
- [ ] 360 px width: no page-level horizontal scroll; table scrolls inside its region.
- [ ] Keyboard-only run-through of the whole flow, including dialog.
- [ ] Unknown URL (`/foo`) → Page not found with working link; direct load of `/expenses/new` works.
- [ ] README ≤ 500 words, all four parts present, rounding rule stated.
- [ ] Repo clean: `.gitignore` has `node_modules`, `dist`; no stray files; sensible commit history.
