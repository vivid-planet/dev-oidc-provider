import { defineConfig } from "../src";

export default defineConfig({
    userProvider: () => [
        {
            id: "1",
            name: "Admin",
            email: "demo@comet-dxp.com",
        },
        {
            id: "2",
            name: "Non-Admin",
            email: "non-admin@comet-dxp.com",
        },
    ],
    client: {
        client_id: "comet-demo-client",
        client_secret: "secret",
        redirect_uris: ["http://localhost:5555/callback"],
    },
});
