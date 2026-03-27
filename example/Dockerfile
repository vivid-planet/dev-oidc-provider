FROM golang:1.26-alpine AS builder

RUN apk add --no-cache --update alpine-sdk
RUN git clone https://github.com/dexidp/dex
RUN cd dex && make bin/example-app

FROM alpine:3.23
RUN apk add --update ca-certificates openssl
COPY --from=builder /go/dex/bin/example-app /usr/local/bin/example-app

WORKDIR /

ENTRYPOINT ["example-app", "--issuer=http://localhost:8080", "--redirect-uri=http://localhost:5555/callback", "--debug"]