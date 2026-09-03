import { defineConfig } from "../src";

const users = [
    {
        id: "1",
        name: "Admin",
        email: "demo@example.com",
        role: "admin",
    },
    {
        id: "2",
        name: "Non-Admin",
        email: "non-admin@example.com",
        role: "user",
    },
    ...Array.from({ length: 30 }, (_, i) => ({
        id: String(i + 3),
        name: `Example User ${i + 1}`,
        email: `example-user-${i + 1}@example.com`,
        role: "user",
    })),
];

export default defineConfig({
    getUser: (id) => users.find((user) => user.id === id),
    searchUsers: ({ search, offset, limit }) => {
        const query = search.toLowerCase();
        return users
            .filter((user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query))
            .slice(offset, offset + limit);
    },
    profileClaims: ["name", "role"],
    client: {
        client_id: "demo-client",
        client_secret: "secret",
        redirect_uris: ["http://localhost:5555/callback"],
    },
});
