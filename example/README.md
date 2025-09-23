## Local development

1. Start OIDC-Provider (uses `dev-oidc-provider.config.mts`)

    `npx tsx ../src/run.ts`

2. Start OIDC-Client (via Docker)

    `docker run --rm -it --network="host" $(docker build -q .) --client-id comet-demo-client --client-secret secret`

3. Open http://localhost:5555 in your browser to launch the OIDC-Client
