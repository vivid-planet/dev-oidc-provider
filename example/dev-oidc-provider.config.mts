import { defineConfig } from "../src";

const users = [
    {
        id: "1",
        name: "Admin",
        email: "demo@example.com",
    },
    {
        id: "2",
        name: "Non-Admin",
        email: "non-admin@example.com",
    },
];

export default defineConfig({
    userProvider: (params) => {
        if (!params?.search) {
            return [];
        }
        const search = params.search.toLowerCase();
        return users
            .filter((user) => user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search))
            .slice(params.offset, params.offset + params.limit);
    },
    enableUserSearch: true,
    client: {
        client_id: "demo-client",
        client_secret: "secret",
        redirect_uris: ["http://localhost:5555/callback"],
    },
});
