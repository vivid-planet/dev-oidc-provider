# dev-oidc-provider

This package can be used to spin up an OIDC provider for local development.

## Installation

`npm i -D dev-oidc-provider`

## Create config file

The name must be dev-oidc-provider.config.mts and you have to place the working directory.

Example:

```ts title="dev-oidc-provider.config.mts"
import { defineConfig } from "dev-oidc-provider";

export default defineConfig({
    userProvider: () => [
        {
            id: "1",
            name: "Admin",
            email: "demo@example.com",
        },
        {
            id: "2",
            name: "Non-Admin",
            email: "non-admin@example.com",
        },
    ],
    client: {
        client_id: "demo-client",
        client_secret: "secret",
        redirect_uris: ["http://localhost:8000/oauth2/callback"],
        post_logout_redirect_uris: ["http://localhost:8000/oauth2/sign_out?rd=%2F"],
    },
});
```

## Many users

The login page normally lists every configured user in a dropdown. `userProvider` is called once
at startup with no arguments to get the initial user list, used to resolve the signed-in account,
derive the profile claims, and populate that dropdown. If that call returns no users, the login
page assumes you don't want to preload everyone and shows a search box instead: it starts out empty
and only shows matches once you start typing, calling `userProvider` again with
`{ search, offset: 0, limit: 1000 }`.

```ts title="dev-oidc-provider.config.mts"
export default defineConfig({
    userProvider: (params) => {
        if (!params) return getAllUsers(); // startup: return [] here instead to force the search box
        if (!params.search) return []; // search box cleared: nothing to show until you search
        return searchUsers(params.search, { offset: params.offset, limit: params.limit });
    },
    // ...
});
```

## Start dev-oidc-provider

Execute `npx dev-oidc-provider` to start the application.

Alternatively you can add the command to your `package.json` as a script and call it via `npm`:

```diff title="package.json"
    "scripts": {
+       "dev-oidc-provider": "dev-oidc-provider",
```
