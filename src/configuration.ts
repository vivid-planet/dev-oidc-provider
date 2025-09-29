import { type ClientMetadata, type Configuration } from "oidc-provider";

import { type User } from "./";

export const createConfiguration: (users: User[], client: ClientMetadata) => Configuration = (users, client) => ({
    clients: [client],
    clientDefaults: {
        grant_types: ["authorization_code", "refresh_token"],
        token_endpoint_auth_method: "client_secret_post",
    },
    findAccount: async (_ctx, sub) => {
        const index = users.findIndex((u) => u.id === sub);
        const user = users[index] ? users[index] : users[0];
        return {
            accountId: sub,
            claims: () => ({ sub, email: user.email, name: user.name }),
        };
    },
    claims: {
        email: ["email"],
        profile: ["name"],
    },
    conformIdTokenClaims: false,
    features: {
        rpInitiatedLogout: {
            logoutSource: async (ctx, form) => {
                ctx.body = await ctx.render("logout", {
                    ctx,
                    form,
                    title: "Sign-out",
                });
            },
        },
        introspection: { enabled: true },
    },
    // Skip consent prompt: https://github.com/panva/node-oidc-provider/discussions/1307
    async loadExistingGrant(ctx) {
        const grantId = ctx.oidc.result?.consent?.grantId || (ctx.oidc.client && ctx.oidc.session?.grantIdFor(ctx.oidc.client.clientId));

        if (grantId) {
            // keep grant expiry aligned with session expiry
            // to prevent consent prompt being requested when grant expires
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const grant = (await ctx.oidc.provider.Grant.find(grantId)) as any;

            // this aligns the Grant ttl with that of the current session
            // if the same Grant is used for multiple sessions, or is set
            // to never expire, you probably do not want this in your code
            if (ctx.oidc.account && ctx.oidc.session && grant.exp < ctx.oidc.session.exp) {
                grant.exp = ctx.oidc.session.exp;

                await grant.save();
            }

            return grant;
        }

        if (!ctx.oidc.client || !ctx.oidc.session) {
            return undefined;
        }

        const grant = new ctx.oidc.provider.Grant({
            clientId: ctx.oidc.client.clientId,
            accountId: ctx.oidc.session.accountId,
        });

        grant.addOIDCScope("openid email profile");
        grant.addOIDCClaims(["name"]);
        await grant.save();
        return grant;
    },
    async issueRefreshToken(ctx, client, code) {
        return true;
    },
});
