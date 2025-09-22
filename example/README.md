#!/usr/bin/env bash
set -e
cd $(dirname $0)

npx tsx dev.ts

docker run --rm -it --network="host" $(docker build -q .) --client-id comet-demo-client --client-secret secret

# Local development of @comet/dev-oidc-provider

1. Start OIDC-Provider

    `npx tsx dev.ts`

2. Start OIDC-Client (via Docker)

    `docker run --rm -it --network="host" $(docker build -q .) --client-id comet-demo-client --client-secret secret`

3. Open http://localhost:5555 in your browser to launch the OIDC-Client
