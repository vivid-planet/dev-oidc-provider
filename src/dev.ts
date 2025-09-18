import { startDevOidcProvider } from "src";

startDevOidcProvider({
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
});
