# dev-oidc-provider

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
