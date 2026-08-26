---
"dev-oidc-provider": patch
---

Upgraded `@koa/router` to v15, `koa-body` to v8, and `oidc-provider` to the latest v9 release, and modernized the build/lint tooling:

-   Swapped `@comet/eslint-config` for `@dextinity/eslint-config` and `@changesets/cli` to v3
-   Modernized `tsconfig.json` (target/lib/module/moduleResolution updated for Node 22+, dropped the deprecated `baseUrl`)
-   Added `exports`, `files`, and `sideEffects` to `package.json` for a correct npm publish contract
-   Bumped `actions/setup-node` to v7 in CI workflows

No public API changes.
