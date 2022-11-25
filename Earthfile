VERSION 0.6
FROM golang:1.18.8-alpine3.16
WORKDIR /lsp-conf

glibc:
    # NOTE: Glibc 2.35 package is broken: https://github.com/sgerrand/alpine-pkg-glibc/issues/176, so we stick to 2.34 for now
    RUN ALPINE_GLIBC_BASE_URL="https://github.com/sgerrand/alpine-pkg-glibc/releases/download" && \
        ALPINE_GLIBC_PACKAGE_VERSION="2.34-r0" && \
        ALPINE_GLIBC_BASE_PACKAGE_FILENAME="glibc-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
        ALPINE_GLIBC_BIN_PACKAGE_FILENAME="glibc-bin-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
        ALPINE_GLIBC_I18N_PACKAGE_FILENAME="glibc-i18n-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
        apk add --no-cache --virtual=.build-dependencies wget ca-certificates && \
        echo \
            "-----BEGIN PUBLIC KEY-----\
!MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApZ2u1KJKUu/fW4A25y9m\
!y70AGEa/J3Wi5ibNVGNn1gT1r0VfgeWd0pUybS4UmcHdiNzxJPgoWQhV2SSW1JYu\
!tOqKZF5QSN6X937PTUpNBjUvLtTQ1ve1fp39uf/lEXPpFpOPL88LKnDBgbh7wkCp\
!m2KzLVGChf83MS0ShL6G9EQIAUxLm99VpgRjwqTQ/KfzGtpke1wqws4au0Ab4qPY\
!KXvMLSPLUp7cfulWvhmZSegr5AdhNw5KNizPqCJT8ZrGvgHypXyiFvvAH5YRtSsc\
!Zvo9GI2e2MaZyo9/lvb+LbLEJZKEQckqRj4P26gmASrZEPStwc+yqy1ShHLA0j6m\
!1QIDAQAB\
!-----END PUBLIC KEY-----" | sed 's/\!/\n/g' > "/etc/apk/keys/sgerrand.rsa.pub" && \
        wget \
            "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
            "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
            "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_I18N_PACKAGE_FILENAME" && \
        mv /etc/nsswitch.conf /etc/nsswitch.conf.bak && \
        apk add --no-cache --force-overwrite \
            "$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
            "$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
            "$ALPINE_GLIBC_I18N_PACKAGE_FILENAME" && \
        \
        mv /etc/nsswitch.conf.bak /etc/nsswitch.conf && \
        rm "/etc/apk/keys/sgerrand.rsa.pub" && \
        (/usr/glibc-compat/bin/localedef --force --inputfile POSIX --charmap UTF-8 "$LANG" || true) && \
        echo "export LANG=$LANG" > /etc/profile.d/locale.sh && \
        \
        apk del glibc-i18n && \
        \
        rm "/root/.wget-hsts" && \
        apk del .build-dependencies && \
        rm \
            "$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
            "$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
            "$ALPINE_GLIBC_I18N_PACKAGE_FILENAME"

setup:
    FROM +glibc
    RUN apk update
    RUN apk add -f build-essential bash
    RUN apk add -f --update nodejs-current
    RUN apk add -f --update npm
    RUN node -v
    RUN apk add -f --update curl
    RUN curl -fsSL https://deno.land/x/install/install.sh | DENO_INSTALL=/usr/local sh
    RUN deno -V
    # RUN apk add -f --update nodejs-current --repository="http://dl-cdn.alpinelinux.org/alpine/edge/community"
    # RUN apk search --no-cache nodejs-current nodejs-npm --repository="http://dl-cdn.alpinelinux.org/alpine/edge/community"
    # RUN apk add -f nodejs-current nodejs-npm --repository="http://dl-cdn.alpinelinux.org/alpine/edge/community"

npm:
    FROM +setup
    RUN npm install node-fetch

deps:
    FROM +npm
    COPY --if-exists go.mod go.sum ./
    RUN go mod download
    SAVE ARTIFACT go.mod AS LOCAL go.mod
    SAVE ARTIFACT go.sum AS LOCAL go.sum

build:
    FROM +deps
    COPY --dir jsclient ./
    # RUN ls --full-time
    # RUN go build -o 
    RUN GOOS=js GOARCH=wasm go build -o jsgo ./jsclient
    SAVE ARTIFACT --keep-ts jsgo AS LOCAL jsgo

run:
    FROM +build
    # RUN ls -l *
    COPY --dir go-wasm ./
    RUN deno run --allow-all ./go-wasm/wasm_exec_deno.ts jsgo
    # RUN ls -l ./go-wasm/go_js_wasm_exec
    # RUN ./go-wasm/go_js_wasm_exec jsgo

    # RUN go build -o build/go-example main.go
    # SAVE ARTIFACT build/go-example /go-example AS LOCAL build/go-example

# docker:
#     COPY +build/go-example .
#     ENTRYPOINT ["/go-example/go-example"]
#     SAVE IMAGE --push earthly/examples:go

#####
# Provider Specific Targets
#####

# # Demo for Google Cloud Build, showing use of a dedicated service account
# gcp-cloudbuild:
#     FROM gcr.io/cloud-builders/gsutil
#     RUN --mount type=secret,id=+secrets/earthly-technologies/google/cloudbuild-service-key,target=/root/key.json gcloud auth activate-service-account --key-file=/root/key.json && gsutil ls -p earthly-jupyterlab
