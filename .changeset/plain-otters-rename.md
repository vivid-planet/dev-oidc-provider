---
"dev-oidc-provider": major
---

Rename the package to `dev-oidc-provider`

The `@comet` scope has been removed to make clear that the dev-oidc-provider can be used outside of Comet/Dextinity.

Update the dependency in your `package.json` and any imports accordingly:

```diff
-import { defineConfig } from "@comet/dev-oidc-provider";
+import { defineConfig } from "dev-oidc-provider";
```
