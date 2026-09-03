import Router from "@koa/router";
import { koaBody as bodyParser } from "koa-body";
import type Provider from "oidc-provider";

import type { ListUsers, SearchUsers, User } from "./";

const filterUsers = (users: User[], search: string) => {
    const query = search.trim().toLowerCase();
    if (!query) {
        return [];
    }
    return users.filter((user) => user.id === search || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query));
};

export const createRouter = (provider: Provider, source: { searchUsers: SearchUsers } | { users: ListUsers }) => {
    const router = new Router();
    const useSearch = "searchUsers" in source;

    router.get("/interaction/:uid", async (ctx, next) => {
        const { uid, prompt } = await provider.interactionDetails(ctx.req, ctx.res);
        if (prompt.name != "login") {
            return next();
        }
        return ctx.render("login", {
            title: "Sign-in",
            uid,
            users: useSearch ? [] : await source.users(),
            useSearch,
        });
    });
    router.get("/interaction/:uid/users", async (ctx, next) => {
        const { prompt } = await provider.interactionDetails(ctx.req, ctx.res);
        if (prompt.name != "login") {
            return next();
        }

        const q = typeof ctx.query.q === "string" ? ctx.query.q : "";
        if (!useSearch || !q.trim()) {
            ctx.body = [];
            return;
        }
        // searchUsers may already have filtered/paginated by these params (e.g. a database
        // query); filtering again here is a no-op in that case, but is required as a safety net
        // for implementations that ignore the params and always return the full list. Either way,
        // cap the result size.
        const matches = filterUsers(await source.searchUsers({ search: q, offset: 0, limit: 1000 }), q).slice(0, 1000);
        ctx.body = matches;
    });
    router.post(
        "/interaction/:uid/login",
        bodyParser({
            text: false,
            json: false,
            patchNode: true,
            patchKoa: true,
        }),
        async (ctx) => {
            const { login } = ctx.request.body as { login: string };
            return provider.interactionFinished(ctx.req, ctx.res, {
                login: {
                    accountId: login,
                },
            });
        },
    );

    return router;
};
