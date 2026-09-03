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
     * signed-in account, derive the profile claim keys, and, unless `enableUserSearch` is set,
     * populate the login page's dropdown. When `enableUserSearch` is set, this is called again
     * with `{ search, offset, limit }` set as you type in the login page's search box.
     *
     * If your implementation ignores the params and always returns the full list, that's fine —
     * matches are filtered in-memory regardless — but if your users come from a database or API,
     * use `search`/`offset`/`limit` to only fetch matching users instead of loading everyone
     * upfront.
     */
    userProvider: (params?: UserSearchParams) => Promise<Array<User>> | Array<User>;
    /**
     * Switches the login page's user picker from a dropdown (listing the users returned by the
     * initial `userProvider()` call) to a search box (calling `userProvider` again with
     * `{ search, offset, limit }` as you type). Useful when there are too many users to preload
     * and list upfront. Defaults to `false`.
     */
    enableUserSearch?: boolean;
    client: ClientMetadata;
};

export const startDevOidcProvider = async (config: DevOidcProviderConfig) => {
    let server;
    try {
        const useSearch = config.enableUserSearch ?? false;
        const users = await config.userProvider();
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
