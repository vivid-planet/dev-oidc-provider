---
"dev-oidc-provider": minor
---

Add a search-dropdown for the login page for large user lists

`userProvider` now optionally receives a `{ search?: string; offset: number; limit: number }`
object. It's still called with no arguments at startup; if that returns no users, the login page
shows a search box instead of a dropdown, calling `userProvider` again with `{ search, offset: 0,
limit: 1000 }` as you type (debounced client-side).

Existing implementations that ignore the params and always return the full list keep working
unchanged.
