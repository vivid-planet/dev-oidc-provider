import render from "@koa/ejs";
import Provider, { type ClientMetadata } from "oidc-provider";

import { createConfiguration } from "./configuration";
import { createRouter } from "./router";

export type User = {
    id: string;
    name: string;
    email: string;
};

export type DevOidcProviderConfig = {
    port?: number;
    issuer?: string;
    userProvider: () => Promise<Array<User>> | Array<User>;
    client: ClientMetadata;
};

export const startDevOidcProvider = async (config: DevOidcProviderConfig) => {
    let server;
    try {
        const users = await config.userProvider();
        const { port = 8080, issuer = `http://localhost:${port}` } = config;
        const provider = new Provider(issuer, createConfiguration(users, config.client));

        render(provider, {
            cache: false,
            viewExt: "ejs",
            layout: "_layout",
            root: `${__dirname}/../views`,
        });

        provider.use(createRouter(provider, users).routes());

        server = provider.listen(port, () => {
            // eslint-disable-next-line no-console
            console.log(`Application is listening, check out ${issuer}/.well-known/openid-configuration`);
        });
        return server;
    } catch (err) {
        if (server?.listening) server.close();
        console.error(err);
        process.exitCode = 1;
    }
};
