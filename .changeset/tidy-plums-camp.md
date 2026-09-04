---
"dev-oidc-provider": patch
---

### Skip the logout confirmation screen

RP-initiated logout no longer requires the user to click "Sign out" on an intermediate confirmation page. The logout form now auto-submits (falling back to the original confirmation buttons if JavaScript is disabled).
