---
"dev-oidc-provider": major
---

Drop the `@comet` scope from the package name

The package is now published as `dev-oidc-provider` instead of `@comet/dev-oidc-provider`.
Update the dependency in your `package.json` and any imports accordingly:

```diff
-import { defineConfig } from "@comet/dev-oidc-provider";
+import { defineConfig } from "dev-oidc-provider";
```
