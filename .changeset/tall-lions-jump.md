---
"dev-oidc-provider": minor
---

Add a search box for the login page for large user lists

`userProvider` now optionally receives a `{ search?: string; offset: number; limit: number }`
object. Set the new `enableUserSearch: true` config option to switch the login page's user picker
from a dropdown (populated by the existing startup call to `userProvider`) to a search box, which
calls `userProvider` again with `{ search, offset: 0, limit: 1000 }` as you type (debounced
client-side).

Existing implementations that ignore the params and always return the full list keep working
unchanged.
