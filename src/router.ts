import Router from "@koa/router";
import { koaBody as bodyParser } from "koa-body";
import type Provider from "oidc-provider";
import { type User } from "src";

export const createRouter = (provider: Provider, users: User[]) => {
    const router = new Router();

    router.get("/interaction/:uid", async (ctx, next) => {
        const { uid, prompt } = await provider.interactionDetails(ctx.req, ctx.res);
        if (prompt.name != "login") return next();
        return ctx.render("login", {
            title: "Sign-in",
            uid,
            users,
        });
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
            return provider.interactionFinished(ctx.req, ctx.res, {
                login: {
                    accountId: ctx.request.body.login,
                },
            });
        },
    );

    return router;
};
