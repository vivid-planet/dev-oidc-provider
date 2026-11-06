import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { beginAuth, createBrowser, decodeJwt, postToken, redirectUri, registerCleanup, runFlow, startProvider } from "./helpers";

registerCleanup();

const users = [
    { id: "1", name: "Admin", email: "admin@example.com", role: "admin" },
    { id: "2", name: "Non-Admin", email: "non-admin@example.com", role: "user" },
];

const getJson = async (url: string, headers: Record<string, string> = {}) => {
    const response = await fetch(url, { headers });
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
};

describe("discovery", () => {
    it("uses the port as issuer by default", async () => {
        const base = await startProvider({ listUsers: () => users });
        const { body } = await getJson(`${base}/.well-known/openid-configuration`);
        assert.equal(body.issuer, base);
    });

    it("uses a custom issuer", async () => {
        const base = await startProvider({ listUsers: () => users, issuer: "http://localhost:1234" });
        const { body } = await getJson(`${base}/.well-known/openid-configuration`);
        assert.equal(body.issuer, "http://localhost:1234");
    });
});

describe("login with listUsers", () => {
    it("lists all users on the login page", async () => {
        const base = await startProvider({ listUsers: () => users });
        const request = createBrowser();
        const uid = await beginAuth(base, request);
        const html = await (await request(`${base}/interaction/${uid}`)).text();
        assert.match(html, /Admin/);
        assert.match(html, /Non-Admin/);
    });

    it("keeps working with the deprecated userProvider", async () => {
        const base = await startProvider({ userProvider: () => users } as never);
        const { tokens } = await runFlow(base, { login: "2" });
        assert.equal(decodeJwt(tokens?.id_token as string).sub, "2");
    });

    it("issues an id token with the claims of the selected user", async () => {
        const base = await startProvider({ listUsers: () => users });
        const { tokens } = await runFlow(base, { login: "2" });
        const claims = decodeJwt(tokens?.id_token as string);
        assert.equal(claims.sub, "2");
        assert.equal(claims.name, "Non-Admin");
        assert.equal(claims.email, "non-admin@example.com");
        assert.equal(claims.role, "user");
        assert.equal(claims.aud, "c");
    });

    it("exposes only the configured profileClaims", async () => {
        const base = await startProvider({ listUsers: () => users, profileClaims: ["name"] });
        const { tokens } = await runFlow(base);
        const claims = decodeJwt(tokens?.id_token as string);
        assert.equal(claims.name, "Admin");
        assert.equal(claims.role, undefined);
    });

    it("returns the user claims at the userinfo endpoint", async () => {
        const base = await startProvider({ listUsers: () => users });
        const { tokens } = await runFlow(base);
        const { status, body } = await getJson(`${base}/me`, { authorization: `Bearer ${tokens?.access_token}` });
        assert.equal(status, 200);
        assert.equal(body.sub, "1");
        assert.equal(body.email, "admin@example.com");
    });

    it("does not ask for consent", async () => {
        const base = await startProvider({ listUsers: () => users });
        // runFlow fails if the flow is redirected to a consent interaction instead of the client
        const { error, tokens } = await runFlow(base);
        assert.equal(error, undefined);
        assert.ok(tokens?.access_token);
    });
});

describe("token endpoint", () => {
    it("issues a refresh token that can be exchanged", async () => {
        const base = await startProvider({ listUsers: () => users });
        const { tokens } = await runFlow(base);
        assert.ok(tokens?.refresh_token);
        const refreshed = await postToken(base, { grant_type: "refresh_token", refresh_token: tokens?.refresh_token as string });
        assert.equal(refreshed.status, 200);
        assert.ok(refreshed.body.access_token);
        assert.notEqual(refreshed.body.access_token, tokens?.access_token);
    });

    it("rejects a wrong client secret", async () => {
        const base = await startProvider({ listUsers: () => users });
        const { code } = await runFlow(base);
        const response = await fetch(`${base}/token`, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: code as string,
                redirect_uri: redirectUri,
                client_id: "c",
                client_secret: "wrong",
            }).toString(),
        });
        assert.equal(response.status, 401);
    });

    it("introspects an access token", async () => {
        const base = await startProvider({ listUsers: () => users });
        const { tokens } = await runFlow(base);
        const response = await fetch(`${base}/token/introspection`, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ token: tokens?.access_token as string, client_id: "c", client_secret: "s" }).toString(),
        });
        const body = (await response.json()) as Record<string, unknown>;
        assert.equal(body.active, true);
        assert.equal(body.sub, "1");
    });
});

describe("authorization endpoint", () => {
    it("rejects an unregistered redirect_uri", async () => {
        const base = await startProvider({ listUsers: () => users });
        const response = await fetch(
            `${base}/auth?client_id=c&response_type=code&scope=openid&redirect_uri=${encodeURIComponent("http://evil.example/cb")}`,
            {
                redirect: "manual",
            },
        );
        assert.notEqual(response.status, 303);
        assert.match(await response.text(), /redirect_uri/);
    });
});

describe("login with searchUsers", () => {
    const start = () =>
        startProvider({
            searchUsers: ({ search }) => users.filter((user) => user.name.toLowerCase().includes(search.toLowerCase())),
            getUser: (id) => users.find((user) => user.id === id),
            profileClaims: ["name", "role"],
        });

    it("shows no users upfront", async () => {
        const base = await start();
        const request = createBrowser();
        const uid = await beginAuth(base, request);
        const html = await (await request(`${base}/interaction/${uid}`)).text();
        assert.match(html, /user-search-input/);
        assert.doesNotMatch(html, /admin@example\.com/);
    });

    it("returns matching users", async () => {
        const base = await start();
        const request = createBrowser();
        const uid = await beginAuth(base, request);
        const response = await request(`${base}/interaction/${uid}/users?q=non`);
        assert.deepEqual(await response.json(), [users[1]]);
    });

    it("returns nothing for an empty search", async () => {
        const base = await start();
        const request = createBrowser();
        const uid = await beginAuth(base, request);
        const response = await request(`${base}/interaction/${uid}/users?q=%20`);
        assert.deepEqual(await response.json(), []);
    });

    it("resolves the signed-in user with getUser", async () => {
        const base = await start();
        const { tokens } = await runFlow(base, { login: "2" });
        const claims = decodeJwt(tokens?.id_token as string);
        assert.equal(claims.sub, "2");
        assert.equal(claims.role, "user");
    });
});
