import { type DevOidcProviderConfig, startDevOidcProvider } from "src";
import { loadConfig } from "unconfig";

async function runFromCli() {
    const { config, sources } = await loadConfig<DevOidcProviderConfig>({
        sources: [
            {
                files: "dev-oidc-provider.config",
                extensions: ["mts"],
            },
        ],
    });
    // eslint-disable-next-line no-console
    console.log("Using config from", sources);
    if (!config) {
        console.error("No config found");
        process.exit(1);
    }
    await startDevOidcProvider(config);
}
runFromCli();
