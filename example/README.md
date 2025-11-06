## Local development

1. Start OIDC-Provider (uses `dev-oidc-provider.config.mts`)

    `npm run build && node ../lib/run.js`

2. Start OIDC-Client (via Docker, make sure to have "Enable host networking" activated)

    `docker run --rm -it --network="host" $(docker build -q .) --client-id comet-demo-client --client-secret secret`

3. Open http://localhost:5555 in your browser to launch the OIDC-Client
