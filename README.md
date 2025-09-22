# @comet/dev-oidc-provider

This package can be used to spin up an OIDC provider for local development.

## Installation

`npm i -D @comet/dev-oidc-provider`

## Create config file

The name must be dev-oidc-provider.config.mts and you have to place the working directory.

Example:

```ts title="dev-oidc-provider.config.mts"
import { defineConfig } from "./src";

export default defineConfig({
    userProvider: () => [
        {
            id: "1",
            name: "Admin",
            email: "demo@comet-dxp.com",
        },
        {
            id: "2",
            name: "Non-Admin",
            email: "non-admin@comet-dxp.com",
        },
    ],
    client: {
        client_id: "comet-demo-client",
        client_secret: "secret",
        redirect_uris: ["http://localhost:8000/oauth2/callback"],
        post_logout_redirect_uris: ["http://localhost:8000/oauth2/sign_out?rd=%2F"],
    },
});
```

## Start dev-oidc-provider

Execute `npx dev-oidc-provider` to start the application.

Alternatively you can add the command to your `package.json` as a script and call it via `npm`:

```diff title="package.json"
    "scripts": {
+       "dev-oidc-provider": "dev-oidc-provider",
```
