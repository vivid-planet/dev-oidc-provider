---
"dev-oidc-provider": patch
---

### Fix several issues introduced with `enableUserSearch`

Fix the id token not returning the requested scopes' claims when `enableUserSearch` was active. With search enabled, the initial `userProvider()` call (previously used both to resolve the signed-in account and to derive `profile` claims) returns no users up front, so the signed-in account's claims silently came up empty.

Replace the single, overloaded `userProvider(params)` + `enableUserSearch` config with three purpose-built functions, so the login-vs-list-vs-search shape is enforced by the type system instead of by convention:

- `listUsers: () => User[]` — get every user up front, for the login page's dropdown (replaces the no-args call to `userProvider`). `userProvider` still works, unchanged, as a deprecated alias.
- `searchUsers: ({ search, offset, limit }) => User[]` and `getUser: (id) => User | undefined` — provide both instead of `listUsers` when there are too many users to preload. `enableUserSearch` is gone; passing `searchUsers` is what enables the search box.

Since claims can no longer be reliably inferred from a preloaded list when using `searchUsers`, add a `profileClaims` config option to set them explicitly.
