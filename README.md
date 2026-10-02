# Trip Splitter

A group travel expense sharing web application built with React, Redux Toolkit, strict TypeScript, and accessible semantic UI.

## Run it

```bash
npm install
npm run dev
```

Other available scripts:
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)
- `npm run lint` — ESLint flat config with strict typescript-eslint and jsx-a11y
- `npm test` — Vitest unit and integration test suite
- `npm run build` — Production build bundle

**Not finished / known gaps:** Nothing. All 22 requirements from the specification are fully implemented and verified with automated tests.

## Rounding rule

We implement the **largest-remainder method (Hamilton-Hare method)**, with ties broken deterministically by trip member order (Aarav → Diya → Kabir → Meera → Rohan).
For example, ₹100 split equally among 3 members (Aarav, Diya, Kabir) produces ₹33.34, ₹33.33, and ₹33.33. The exact same rule powers percentage splits (basis points). Balances across all trip members always sum to exactly ₹0.00 without any lost or invented paise.

## Three decisions

1. **Integer paise everywhere + unified `allocate` engine**:
   All monetary amounts are represented and calculated as integer paise (`125050` = `₹1,250.50`), and percentages as basis points (`3333` = `33.33%`). Floating-point arithmetic is completely eliminated from domain logic. The single pure `allocate()` function handles both equal and percentage splits with invariant checks (`Σ shares === amount`). Formatting occurs only in `formatINR()`.
2. **Local form state (`useReducer`) with derived validation errors**:
   Draft form inputs (raw strings) are held in component-local reducer state. Redux only receives clean, validated `NewExpense` records. Errors are derived synchronously on render from the pure function `validateExpenseDraft(draft, ctx)`, ensuring zero stale errors and immediate feedback as the user fixes fields.
3. **Storage isolation in `persistence.ts` via `store.subscribe` with runtime type guards**:
   Storage logic is isolated from UI components and Redux reducers. Redux store updates subscribe to save state automatically when expenses change. Stored and sample data pass through exhaustive runtime guards (`parsePersistedState`) before entering Redux, ensuring corrupt or missing local data cleanly falls back to sample data with zero unsafe type assertions (`as`) or non-null assertions (`!`).

## With another day

1. **Optimal settlement transactions**: An algorithm to suggest the minimum number of payments to settle all debts (e.g., greedy min-cash-flow).
2. **Edit existing expense**: Ability to edit an expense with the draft form pre-filled and instant balance recalculation.
3. **URL search params for filters**: Persisting category filter selections in query parameters (`/?category=Food`) for shareable URLs.
4. **Cross-tab state synchronization**: Listening to the `window` `'storage'` event to keep balances updated across multiple open tabs.

## AI tools

AI tools were used as a pair programmer to scaffold test scenarios, structure edge-case verification tables, and review implementation against the specification. All code, types, rounding math, and components were reviewed, understood, and manually verified.
