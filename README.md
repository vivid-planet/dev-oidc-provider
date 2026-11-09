# dev-oidc-provider

This package can be used to spin up an OIDC provider for local development.

## Installation

`npm i -D dev-oidc-provider`

## Create config file

The name must be dev-oidc-provider.config.mts and you have to place the working directory.

Example:

```ts title="dev-oidc-provider.config.mts"
import { defineConfig } from "dev-oidc-provider";

const users = [
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
];

export default defineConfig({
    listUsers: () => users,
    client: {
        client_id: "demo-client",
        client_secret: "secret",
        redirect_uris: ["http://localhost:8000/oauth2/callback"],
        post_logout_redirect_uris: ["http://localhost:8000/oauth2/sign_out?rd=%2F"],
    },
});
```

`listUsers` is called once at startup to get every user. It populates the login page's dropdown
and, unless `profileClaims` is set, is also used to derive the `profile` scope's claims (see
below).

> `userProvider` (the same shape as `listUsers`) still works as a deprecated alias, if you're
> upgrading from an older version.

## Many users

If you have too many users to preload and list upfront, provide `searchUsers` and `getUser`
instead of `listUsers`. The login page then shows a search box instead of the dropdown: it starts
out empty and only shows matches once you start typing, calling `searchUsers` with
`{ search, offset, limit }`. `getUser` resolves the signed-in account by id on every login — it's
required in this mode since there's no preloaded list to look it up in.

```ts title="dev-oidc-provider.config.mts"
export default defineConfig({
    searchUsers: ({ search, offset, limit }) => searchUsersInDb(search, { offset, limit }),
    getUser: (id) => findUserById(id),
    profileClaims: ["name", "role"],
    // ...
});
```

## Profile claims

The `profile` scope's claims are, by default, inferred from the keys of the first user returned by
`listUsers` (excluding `id` and `email`). With `searchUsers` there's no preloaded list to infer
from, so set `profileClaims` explicitly in that case — or whenever you want to control which
fields are exposed regardless of what `listUsers` returns.

## Resource Indicators (RFC 8707)

By default every `resource` parameter is rejected with `invalid_target`. Some clients (e.g. the
MCP SDK) always send it, so you can allow resources with the optional `allowedResources` setting:

```ts title="dev-oidc-provider.config.mts"
export default defineConfig({
    // list of allowed resources, or "*" to accept any resource
    allowedResources: ["http://localhost:4600/mcp"],
    // ...
});
```

The requested resource is set as `aud` claim of the access token (a JWT). Note that the client has to send
`resource` in the authorization request and in the token request. Access tokens issued for a
resource are meant for that resource server, so they can't be used at the `userinfo` endpoint. The
ID token is not affected. Without `allowedResources` nothing changes.

## Start dev-oidc-provider

Execute `npx dev-oidc-provider` to start the application.

Alternatively you can add the command to your `package.json` as a script and call it via `npm`:

```diff title="package.json"
    "scripts": {
+       "dev-oidc-provider": "dev-oidc-provider",
```
