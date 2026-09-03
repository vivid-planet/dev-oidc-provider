import render from "@koa/ejs";
import Provider, { type ClientMetadata } from "oidc-provider";

import { createConfiguration } from "./configuration";
import { createRouter } from "./router";

export type User = {
    id: string;
    name: string;
    email: string;
};

export type ListUsers = () => Promise<Array<User>> | Array<User>;
export type GetUser = (id: string) => Promise<User | undefined> | User | undefined;
export type SearchUsersParams = { search: string; offset: number; limit: number };
export type SearchUsers = (params: SearchUsersParams) => Promise<Array<User>> | Array<User>;

type SharedConfig = {
    port?: number;
    issuer?: string;
    /**
     * Claims exposed under the `profile` scope. If not set, they're inferred from the keys of the
     * first user returned by `listUsers`/`userProvider` (excluding `id` and `email`) — or, when
     * there's nothing to infer from (e.g. when using `searchUsers`), default to just `["name"]`.
     */
    profileClaims?: Array<string>;
    client: ClientMetadata;
};

export type DevOidcProviderConfig =
    | (SharedConfig & {
          /**
           * Called once at startup with no arguments to get every user, used to populate the login
           * page's dropdown and, unless `profileClaims` is set, to derive the profile claim keys.
           */
          listUsers: ListUsers;
          userProvider?: never;
          searchUsers?: never;
          getUser?: never;
      })
    | (SharedConfig & {
          /** @deprecated Use `listUsers` instead. */
          userProvider: ListUsers;
          listUsers?: never;
          searchUsers?: never;
          getUser?: never;
      })
    | (SharedConfig & {
          /**
           * Called as you type in the login page's search box, instead of preloading every user
           * upfront with `listUsers`. Useful when there are too many users to list all at once.
           */
          searchUsers: SearchUsers;
          /**
           * Resolves the signed-in account by id on every login. Required alongside `searchUsers`,
           * since there's no preloaded list to look the account up in.
           */
          getUser: GetUser;
          listUsers?: never;
          userProvider?: never;
      });

export const startDevOidcProvider = async (config: DevOidcProviderConfig) => {
    let server;
    try {
        const { port = 8080, issuer = `http://localhost:${port}` } = config;

        let getUser: GetUser;
        let source: { searchUsers: SearchUsers } | { users: ListUsers };

        if (typeof config.searchUsers === "function") {
            getUser = config.getUser;
            source = { searchUsers: config.searchUsers };
        } else {
            const listUsers = typeof config.listUsers === "function" ? config.listUsers : config.userProvider;
            getUser = async (id) => (await listUsers()).find((user) => user.id === id);
            source = { users: listUsers };
        }

        let profileClaims = config.profileClaims;
        if (!profileClaims) {
            const users = "users" in source ? await source.users() : [];
            profileClaims = users.length > 0 ? Object.keys(users[0]).filter((key) => key !== "id" && key !== "email") : ["name"];
        }

        const provider = new Provider(issuer, createConfiguration(getUser, profileClaims, config.client));

        render(provider, {
            cache: false,
            viewExt: "ejs",
            layout: "_layout",
            root: `${__dirname}/../views`,
        });

        provider.use(createRouter(provider, source).routes());

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
