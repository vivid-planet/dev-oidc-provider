import assert from "node:assert/strict";
import type { Server } from "node:http";
import { createServer } from "node:net";
import { after } from "node:test";

import { type DevOidcProviderConfig, startDevOidcProvider } from "../src";

export const redirectUri = "http://localhost:5555/callback";

const servers: Server[] = [];

const getFreePort = () =>
    new Promise<number>((resolve, reject) => {
        const server = createServer();
        server.once("error", reject);
        server.listen(0, () => {
            const { port } = server.address() as { port: number };
            server.close(() => resolve(port));
        });
    });

type UserSource =
    | { listUsers: NonNullable<DevOidcProviderConfig["listUsers"]> }
    | { searchUsers: NonNullable<DevOidcProviderConfig["searchUsers"]>; getUser: NonNullable<DevOidcProviderConfig["getUser"]> };

/** Starts a provider on a free port and returns its base url. All started providers are closed after the test file. */
export const startProvider = async (config: Partial<DevOidcProviderConfig> & UserSource) => {
    const port = await getFreePort();
    const server = await startDevOidcProvider({
        port,
        client: { client_id: "c", client_secret: "s", redirect_uris: [redirectUri] },
        ...config,
    } as DevOidcProviderConfig);
    assert.ok(server);
    servers.push(server);
    return `http://localhost:${port}`;
};

export const registerCleanup = () => {
    after(() => {
        servers.forEach((server) => server.close());
    });
};

// Minimal browser: follows redirects manually and keeps cookies.
export const createBrowser = () => {
    const cookies = new Map<string, string>();
    return async (url: string, init: RequestInit = {}) => {
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
};

type Request = ReturnType<typeof createBrowser>;

/** Sends the authorization request and returns the location it redirects to. */
const sendAuth = async (base: string, request: Request, params: Record<string, string> = {}) => {
    const url = new URL(`${base}/auth`);
    url.search = new URLSearchParams({
        client_id: "c",
        response_type: "code",
        redirect_uri: redirectUri,
        scope: "openid email profile",
        state: "x",
        ...params,
    }).toString();
    const response = await request(url.href);
    return new URL(response.headers.get("location") as string, base);
};

/** Sends the authorization request and returns the uid of the login interaction. */
export const beginAuth = async (base: string, request: Request, params: Record<string, string> = {}) => {
    const location = await sendAuth(base, request, params);
    assert.ok(location.pathname.startsWith("/interaction/"), `expected an interaction redirect, got ${location.href}`);
    return location.pathname.split("/")[2];
};

/** Submits the login form and follows the redirects until the client's redirect_uri is reached. */
export const finishLogin = async (base: string, request: Request, uid: string, login: string) => {
    const response = await request(`${base}/interaction/${uid}/login`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ login }).toString(),
    });
    let location = new URL(response.headers.get("location") as string, base);
    while (!location.href.startsWith(redirectUri)) {
        const next = await request(location.href);
        location = new URL(next.headers.get("location") as string, base);
    }
    return location;
};

export const postToken = async (base: string, body: Record<string, string>) => {
    const response = await fetch(`${base}/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: "c", client_secret: "s", ...body }).toString(),
    });
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
};

type FlowOptions = { login?: string; scope?: string; resource?: string };
export type FlowResult = { error?: string; code?: string; status?: number; tokens?: Record<string, unknown> };

/** Runs the complete authorization code flow, including the code exchange. */
export const runFlow = async (base: string, { login = "1", scope, resource }: FlowOptions = {}): Promise<FlowResult> => {
    const request = createBrowser();
    const authLocation = await sendAuth(base, request, { ...(scope ? { scope } : {}), ...(resource ? { resource } : {}) });
    // errors of the authorization request (e.g. invalid_target) redirect to the client before the login
    const location = authLocation.pathname.startsWith("/interaction/")
        ? await finishLogin(base, request, authLocation.pathname.split("/")[2], login)
        : authLocation;
    const error = location.searchParams.get("error");
    if (error) {
        return { error };
    }
    const code = location.searchParams.get("code") as string;
    const { status, body } = await postToken(base, {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        ...(resource ? { resource } : {}),
    });
    return { code, status, tokens: body };
};

export const decodeJwt = (jwt: string) => JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
