import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DevOidcProviderConfig } from "../src";
import { decodeJwt, registerCleanup, runFlow, startProvider } from "./helpers";

registerCleanup();

const users = [{ id: "1", name: "Admin", email: "admin@example.com" }];

const start = (allowedResources?: DevOidcProviderConfig["allowedResources"]) => startProvider({ listUsers: () => users, allowedResources });

describe("resource indicators", () => {
    it("rejects a resource with invalid_target by default", async () => {
        const base = await start();
        assert.equal((await runFlow(base, { resource: "http://localhost:4600/mcp" })).error, "invalid_target");
    });

    it("still works without a resource by default", async () => {
        const base = await start();
        const { tokens } = await runFlow(base);
        assert.ok(tokens?.access_token);
        assert.ok(tokens?.id_token);
    });

    it("accepts a listed resource and sets it as audience", async () => {
        const base = await start(["http://localhost:4600/mcp"]);
        const { error, tokens } = await runFlow(base, { resource: "http://localhost:4600/mcp" });
        assert.equal(error, undefined);
        const payload = decodeJwt(tokens?.access_token as string);
        assert.equal(payload.aud, "http://localhost:4600/mcp");
        assert.equal(payload.sub, "1");
        assert.ok(tokens?.refresh_token);
    });

    it("rejects an unlisted resource", async () => {
        const base = await start(["http://localhost:4600/mcp"]);
        assert.equal((await runFlow(base, { resource: "http://localhost:9999/other" })).error, "invalid_target");
    });

    it("accepts any resource with wildcard", async () => {
        const base = await start("*");
        const { tokens } = await runFlow(base, { resource: "http://localhost:9999/other" });
        assert.equal(decodeJwt(tokens?.access_token as string).aud, "http://localhost:9999/other");
    });
});
