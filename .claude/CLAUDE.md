# Engineering Standards

This repository is a **TypeScript monorepo managed with Turborepo** and enforces **strict, opinionated engineering standards**.

Claude (and any AI assistant) MUST follow the rules in this document.
If generated code contradicts these rules, the code is considered **incorrect**, even if it works.

## 1. Tooling & Enforcement (Non-Negotiable)  

This project uses **Ultracite**, a zero-config preset built on **Biome**, to enforce formatting, linting, and correctness.

### Required Commands

- **Fix issues automatically**
  ```bash
  npx ultracite fix
  ```

* **Check code quality**

  ```bash
  npx ultracite check
  ```

* **Diagnose environment**

  ```bash
  npx ultracite doctor
  ```

Claude MUST assume:

* Formatting and many lint issues are auto-fixable
* Human review focuses on **architecture, correctness, and intent**, not style


## 2. Core Engineering Principles

Write code that is:

* **Explicit** over implicit
* **Type-safe** over convenient
* **Readable** over clever
* **Predictable** over magical
* **Maintainable at scale**

Clarity of intent is more important than brevity.


## 3. TypeScript Standards (Very Important)

### 3.1 Type Safety & Explicitness

* Prefer **explicit parameter and return types** when they add clarity
* Prefer `unknown` over `any`
* `any` is allowed **only**:

  * inside generic implementations where TypeScript cannot model runtime logic
* Use `as const` for immutable objects and enum-like behavior
* Prefer type narrowing (`if`, `switch`) over type assertions
* Never rely on structural coincidence — model intent explicitly

### 3.2 Discriminated Unions (Required Pattern)

Use discriminated unions to model state machines, events, and async states.

**Avoid “bag of optionals”.**

```ts
type FetchState<TData> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: TData }
  | { status: "error"; error: Error };
```

Always exhaustively handle unions using `switch`.


### 3.3 Enums (Do NOT Introduce New Ones)

* Do **not** introduce new `enum`s
* Keep existing enums only if already present
* Use `as const` objects instead

```ts
const Role = {
  ADMIN: "admin",
  USER: "user",
} as const;

type Role = (typeof Role)[keyof typeof Role];
```


### 3.4 Imports & Exports

#### Default Exports

* **Do not use default exports**
* Named exports are the standard
* Default exports are allowed **only if required by a framework** (e.g. Next.js pages)

#### Type Imports

* Always use `import type`
* Prefer top-level `import type` statements

```ts
import type { User } from "./user";
```


## 4. Modern JavaScript / TypeScript Practices

* Prefer `const` by default, `let` only when reassignment is required
* Never use `var`
* Prefer `for...of` over `.forEach()`
* Prefer template literals over string concatenation
* Use optional chaining (`?.`) and nullish coalescing (`??`)
* Use destructuring for objects and arrays
* Avoid nested ternaries
* Prefer early returns to reduce nesting


## 5. Async & Error Handling

* Always `await` promises in async functions
* Prefer `async/await` over `.then()`
* Never use async functions as Promise executors
* Handle errors intentionally:

  * Don’t catch errors just to rethrow them
  * Throw `Error` objects with meaningful messages
* Prefer fail-fast and explicit error paths


## 6. React / UI Standards

### React Rules

* Use function components only
* Hooks must be called unconditionally at the top level
* All hook dependencies must be correct
* Do not define components inside other components
* Use stable keys (never array indices)

### Accessibility (Mandatory)

* Use semantic HTML (`button`, `nav`, `main`, etc.)
* Provide alt text for images
* Use proper heading hierarchy
* Always label form inputs
* Keyboard support must mirror mouse interactions
* Avoid `div` + `role` when semantic elements exist


## 7. Security Rules

* Add `rel="noopener noreferrer"` to `target="_blank"` links
* Avoid `dangerouslySetInnerHTML`
* Never use `eval`
* Never manipulate `document.cookie` directly
* Validate and sanitize all user input
* Assume all external input is untrusted


## 8. Performance Guidelines

* Avoid object/array spread in hot loops
* Hoist regex literals out of loops
* Prefer specific imports over namespace imports
* Avoid barrel files (`index.ts` re-exporting everything)
* Use framework-native image components (e.g. Next.js `<Image />`)


## 9. Testing Standards

* Use `it()` / `test()` blocks only
* Use async/await — never `done`
* Do not commit `.only` or `.skip`
* Avoid deep `describe` nesting
* Test behavior, not implementation details


## 10. Documentation & JSDoc

* Add JSDoc only when behavior is **not obvious**
* Be concise and precise
* Use `{@link}` for internal references
* Prefer self-documenting code over comments


## 11. Installing Dependencies

Claude MUST NOT guess versions.

Always install libraries using the package manager:

```bash
pnpm add <package>
pnpm add -D <package>
```

Never manually edit `package.json` versions.


## 12. AI-Specific Rules (Critical)

When Claude works on this repository:

1. **Plan before coding**

   * Summarize relevant context
   * Identify constraints and invariants
   * Propose a solution and trade-offs

2. **Diff-first workflow**

   * Show diffs before applying changes
   * Keep changes small and focused
   * Never mix refactors with formatting-only changes

3. **Respect architecture**

   * Do not introduce hidden state
   * Do not bypass existing boundaries
   * Do not “simplify” by removing safety checks

4. **Tests are not optional**

   * If behavior changes, tests must change or be added

5. **If unsure: ask**

   * Never assume business rules
   * Never invent requirements


## Final Reminder

Ultracite and Biome handle formatting and linting.

**Your job is to ensure:**

* Correctness
* Explicit intent
* Architectural integrity
* Long-term maintainability

If the code is clever but unclear — it is wrong.
If it works but violates invariants — it is wrong.
If it is hard to reason about — it is wrong.
