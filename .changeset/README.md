# Changesets

This directory holds [Changesets](https://github.com/changesets/changesets) for
the `@takanashi/rikka-*` packages.

## Adding a changeset

Run `pnpm changeset` at the repo root, pick the affected packages, the semver
bump type (major / minor / patch), and write a short description. A markdown
file is created under `.changeset/` — commit it with the rest of the change.

## Releasing

`pnpm release` (driven by `.github/workflows/release.yml`) does the full loop:

1. **Open a PR or publish** — `changesets/action` watches `default`:
   - If there are pending changesets, it opens/updates a **"release packages"**
     PR that bumps versions in `package.json` and refreshes every `CHANGELOG.md`.
   - When the "release packages" PR is merged, the same action runs `pnpm release`.
2. **`pnpm release`** runs `pnpm build && pnpm changeset publish`, which uses
   `pnpm publish` under the hood — workspace deps with `workspace:*` are
   rewritten to real version ranges, and only the bumped packages go to npm.
3. **Idempotent** — re-running the publish step on an already-released version
   is a no-op (pnpm skips versions already on the registry).

## Why not just `npm publish`?

- Changesets gives us per-package changelogs without writing them by hand.
- The "Version Packages" PR is a clean, reviewable diff of every version bump
  and changelog edit before anything is published.
- The `workspace:*` protocol is handled automatically — no manual version
  sync needed.

## Manual local release (escape hatch)

```bash
pnpm changeset version   # bump versions locally
pnpm install             # refresh lockfile
pnpm release             # build + publish
```
