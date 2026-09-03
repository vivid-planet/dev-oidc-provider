# dev-oidc-provider

## 2.1.1

### Patch Changes

- 2d6e6c0: ### Fix several issues introduced with `enableUserSearch`

    Fix the id token not returning the requested scopes' claims when `enableUserSearch` was active. With search enabled, the initial `userProvider()` call (previously used both to resolve the signed-in account and to derive `profile` claims) returns no users up front, so the signed-in account's claims silently came up empty.

    Replace the single, overloaded `userProvider(params)` + `enableUserSearch` config with three purpose-built functions, so the login-vs-list-vs-search shape is enforced by the type system instead of by convention:

    - `listUsers: () => User[]` — get every user up front, for the login page's dropdown (replaces the no-args call to `userProvider`). `userProvider` still works, unchanged, as a deprecated alias.
    - `searchUsers: ({ search, offset, limit }) => User[]` and `getUser: (id) => User | undefined` — provide both instead of `listUsers` when there are too many users to preload. `enableUserSearch` is gone; passing `searchUsers` is what enables the search box.

    Since claims can no longer be reliably inferred from a preloaded list when using `searchUsers`, add a `profileClaims` config option to set them explicitly.

- 4038f5b: Fix the user-search dropdown on the login page being clipped by the sign-in card, and widen it beyond the card so results are easier to read.

## 2.1.0

### Minor Changes

- 7176c3f: Add a search box for the login page for large user lists

    `userProvider` now optionally receives a `{ search?: string; offset: number; limit: number }`
    object. Set the new `enableUserSearch: true` config option to switch the login page's user picker
    from a dropdown (populated by the existing startup call to `userProvider`) to a search box, which
    calls `userProvider` again with `{ search, offset: 0, limit: 1000 }` as you type (debounced
    client-side).

    Existing implementations that ignore the params and always return the full list keep working
    unchanged.

### Patch Changes

- 0919814: Upgraded `@koa/router` to v15, `koa-body` to v8, and `oidc-provider` to the latest v9 release, and modernized the build/lint tooling:

    - Swapped `@comet/eslint-config` for `@dextinity/eslint-config` and `@changesets/cli` to v3
    - Modernized `tsconfig.json` (target/lib/module/moduleResolution updated for Node 22+, dropped the deprecated `baseUrl`)
    - Added `exports`, `files`, and `sideEffects` to `package.json` for a correct npm publish contract
    - Bumped `actions/setup-node` to v7 in CI workflows

    No public API changes.

## 2.0.0

### Major Changes

- 5033a80: Rename the package to `dev-oidc-provider`

    The `@comet` scope has been removed to make clear that the dev-oidc-provider can be used outside of Comet/Dextinity.

    Update the dependency in your `package.json` and any imports accordingly:

    ```diff
    -import { defineConfig } from "@comet/dev-oidc-provider";
    +import { defineConfig } from "dev-oidc-provider";
    ```

## 1.2.1

### Patch Changes

- ff6a368: Add shebang to bin-file

## 1.2.0

### Minor Changes

- 1169fb8: Set all user properties in profile claim

    All properties of the returned User-objects in defineConfig.userProvider are now transferred in the ID-Token.
    So it is possible to use them in the application.

## 1.1.0

### Minor Changes

- 053b452: Support Refresh-Token

## 1.0.0

### Major Changes

- 45fc21d: Initial Release
