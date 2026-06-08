# Scripts

Utility scripts for building, testing, and debugging the rikka monorepo.
The canonical pipeline scripts are wrapped by `pnpm` aliases (see the root
`package.json`); the rest are helper scripts invoked directly with `node`.

## Canonical pipeline (run via `pnpm`)

| Script | Purpose |
|--------|---------|
| `typecheck.mjs` | `pnpm typecheck` — `tsc --noEmit` across every project in parallel. |
| `test.mjs` | `pnpm test` — per-package rstest suites. Always collects v8 coverage; each package writes `lcov.info` + HTML into its own `coverage/`. |
| `ci.mjs` | `pnpm test:all` — typecheck + build + tests. |
| `browser-test.mjs` | _Temporarily disabled._ The old curl-based smoke test gave false positives (curl cannot see SPA shadow-DOM content). A Playwright-based replacement is pending; the verification scripts below are the working prototypes. |

## Verification & QA (require the dev server at `http://localhost:3000`)

| Script | What it does | When to use |
|--------|--------------|-------------|
| `verify-pages.mjs` | Visits every registered route and prints a `✓`/`✗` summary with text snippets. | Quick smoke after any routing change. |
| `verify-all-routes.mjs` | Visits every route; per playground reports compile errors, missing DOM, iframe app subtree, console output, and console errors. | After any change to a page's playground source. |
| `qa-pages.mjs` | Curated smoke test over key routes (home, every docs page, examples, showcases). Asserts non-trivial shadow content + an `<h1>`. | Quick "did the basics render" check. |
| `qa-interactions.mjs` | Drives interactive flows (counter clicks, signal interpolation, showcase rendering) and asserts on the resulting DOM. | When touching reactivity, the playground, or showcase wiring. |

## Debug helpers

| Script | What it does |
|--------|--------------|
| `check-debug.mjs` | Edit the `ROUTE` constant, then run. Prints page-level + DOM-level info for that route: app/shadow presence, content text, content HTML, main HTML, rikka-app shadow HTML, conditional element inspection. |
| `debug-iframe.mjs` | Dumps the full `srcdoc` of the first playground iframe on a page to `/tmp/iframe-srcdoc.html`. Useful for inspecting the importmap, SETUP_SCRIPT, and compiled user code. |

## Conventions

- All Playwright scripts assume the dev server is reachable at
  `http://localhost:3000`. Run `pnpm homepage` (or `pnpm build && pnpm preview`)
  in a separate terminal first.
- Scripts print to stdout and exit with a non-zero code only on internal
  errors, not on detected issues. Inspect stdout for a summary of problems.
- One-off debug scripts should be deleted once they've served their purpose;
  keep this directory curated.
