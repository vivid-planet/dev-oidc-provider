import assert from "node:assert/strict";
import type { Server } from "node:http";
import { after, describe, it } from "node:test";

import { startDevOidcProvider } from "../src";
import type { DevOidcProviderConfig } from "../src";

const users = [{ id: "1", name: "Admin", email: "admin@example.com" }];
const redirectUri = "http://localhost:5555/callback";
let nextPort = 18080;
const servers: Server[] = [];

const start = async (allowedResources?: DevOidcProviderConfig["allowedResources"]) => {
    const port = nextPort++;
    const server = await startDevOidcProvider({
        port,
        listUsers: () => users,
        client: { client_id: "c", client_secret: "s", redirect_uris: [redirectUri] },
        allowedResources,
    });
    assert.ok(server);
    servers.push(server);
    return `http://localhost:${port}`;
};

after(() => {
    servers.forEach((server) => server.close());
});

// Minimal browser: follows redirects manually and keeps cookies.
const createBrowser = () => {
    const cookies = new Map<string, string>();
    const request = async (url: string, init: RequestInit = {}) => {
        const response = await fetch(url, {
            ...init,
            redirect: "manual",
            headers: { ...init.headers, cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; ") },
        });
        for (const setCookie of response.headers.getSetCookie()) {
            const [pair] = setCookie.split(";");
            const [name, ...value] = pair.split("=");
            cookies.set(name, value.join("="));
        }
        return response;
    };
    return request;
};

type FlowResult = { error?: string; code?: string; tokenResponse?: Record<string, unknown> };

const runFlow = async (base: string, resource?: string): Promise<FlowResult> => {
    const request = createBrowser();
    const authUrl = new URL(`${base}/auth`);
    authUrl.search = new URLSearchParams({
        client_id: "c",
        response_type: "code",
        redirect_uri: redirectUri,
        scope: "openid email profile",
        state: "x",
        ...(resource ? { resource } : {}),
    }).toString();

    let response = await request(authUrl.href);
    let location = new URL(response.headers.get("location") as string, base);
    if (location.pathname.startsWith("/interaction/")) {
        const uid = location.pathname.split("/")[2];
        response = await request(`${base}/interaction/${uid}/login`, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ login: "1" }).toString(),
        });
        location = new URL(response.headers.get("location") as string, base);
    }
    // follow redirects inside the provider until we hit the client's redirect_uri
    while (!location.href.startsWith(redirectUri)) {
        response = await request(location.href);
        location = new URL(response.headers.get("location") as string, base);
    }
    const error = location.searchParams.get("error");
    if (error) {
        return { error };
    }
    const code = location.searchParams.get("code") as string;
    const tokenResponse = await fetch(`${base}/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: "c",
            client_secret: "s",
            ...(resource ? { resource } : {}),
        }).toString(),
    });
    return { code, tokenResponse: (await tokenResponse.json()) as Record<string, unknown> };
};

const decodeJwt = (jwt: string) => JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());

describe("resource indicators", () => {
    it("rejects a resource with invalid_target by default", async () => {
        const base = await start();
        assert.equal((await runFlow(base, "http://localhost:4600/mcp")).error, "invalid_target");
    });

    it("still works without a resource by default", async () => {
        const base = await start();
        const { tokenResponse } = await runFlow(base);
        assert.ok(tokenResponse?.access_token);
        assert.ok(tokenResponse?.id_token);
    });

    it("accepts a listed resource and sets it as audience", async () => {
        const base = await start(["http://localhost:4600/mcp"]);
        const { error, tokenResponse } = await runFlow(base, "http://localhost:4600/mcp");
        assert.equal(error, undefined);
        const payload = decodeJwt(tokenResponse?.access_token as string);
        assert.equal(payload.aud, "http://localhost:4600/mcp");
        assert.equal(payload.sub, "1");
        assert.ok(tokenResponse?.refresh_token);
    });

    it("rejects an unlisted resource", async () => {
        const base = await start(["http://localhost:4600/mcp"]);
        assert.equal((await runFlow(base, "http://localhost:9999/other")).error, "invalid_target");
    });

    it("accepts any resource with wildcard", async () => {
        const base = await start("*");
        const { tokenResponse } = await runFlow(base, "http://localhost:9999/other");
        assert.equal(decodeJwt(tokenResponse?.access_token as string).aud, "http://localhost:9999/other");
    });
});
