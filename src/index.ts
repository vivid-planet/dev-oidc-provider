import render from "@koa/ejs";
import Provider, { type ClientMetadata } from "oidc-provider";

import { createConfiguration } from "./configuration";
import { createRouter } from "./router";

export type User = {
    id: string;
    name: string;
    email: string;
};

export type UserSearchParams = {
    search?: string;
    offset: number;
    limit: number;
};

export type DevOidcProviderConfig = {
    port?: number;
    issuer?: string;
    /**
     * Called once at startup with no arguments to get the initial user list, used to resolve the
     * signed-in account, derive the profile claim keys, and populate the login page's dropdown. If
     * that call returns no users, the login page assumes you don't want to preload everyone and
     * shows a search box instead, calling this again with `{ search, offset, limit }` set as you
     * type.
     *
     * If your implementation ignores the params and always returns the full list, that's fine —
     * matches are filtered in-memory regardless — but if your users come from a database or API,
     * use `search`/`offset`/`limit` to only fetch matching users instead of loading everyone
     * upfront.
     */
    userProvider: (params?: UserSearchParams) => Promise<Array<User>> | Array<User>;
    client: ClientMetadata;
};

export const startDevOidcProvider = async (config: DevOidcProviderConfig) => {
    let server;
    try {
        const users = await config.userProvider();
        // No users from the argument-less call means the implementation doesn't want to preload
        // everyone, so the login page shows a search box instead of a dropdown.
        const useSearch = users.length == 0;
        const { port = 8080, issuer = `http://localhost:${port}` } = config;
        const provider = new Provider(issuer, createConfiguration(users, config.client));

        render(provider, {
            cache: false,
            viewExt: "ejs",
            layout: "_layout",
            root: `${__dirname}/../views`,
        });

        provider.use(createRouter(provider, users, config.userProvider, { useSearch }).routes());

        server = provider.listen(port, () => {
            // eslint-disable-next-line no-console
            console.log(`Application is listening, check out ${issuer}/.well-known/openid-configuration`);
        });
        return server;
    } catch (err) {
        if (server?.listening) {
            server.close();
        }
        console.error(err);
        process.exitCode = 1;
    }
};

export function defineConfig(config: DevOidcProviderConfig): DevOidcProviderConfig {
    return config;
}
