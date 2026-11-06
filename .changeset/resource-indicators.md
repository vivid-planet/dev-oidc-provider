---
"dev-oidc-provider": minor
---

Add optional `allowedResources` config to accept Resource Indicators (RFC 8707). Allowed resources are set as audience of the access token. Without the option, requests with a `resource` are still rejected with `invalid_target`.
