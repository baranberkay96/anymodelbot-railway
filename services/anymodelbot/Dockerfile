# syntax=docker/dockerfile:1
#
# AnyModelBot v0.1.23 on Railway.
#
# The official image (ghcr.io/modelflare-ai/anymodel-bot, built by upstream's release workflow from tag v0.1.23 =
# commit 74b7687a4ecd4794f2b4ddfc431e10a175107533) is used unchanged. This layer adds:
#   - FFmpeg and python3-venv, which upstream lists as prerequisites of its ready-made Film Studio and PPT Master
#     bots and which the published image does not contain (Debian bookworm packages, not version-pinned: Debian
#     keeps serving the current bookworm build, a pinned version would disappear);
#   - railway/: a start wrapper that hands the Railway volume to `node`, checks the deploy-form values, removes a
#     data-dir lock left by an earlier container, connects provider keys given as variables through the app's own
#     API, and then runs AnyModelBot as `node`, exactly as upstream's `docker run` does.
#
# Pins (checked 2026-11-07): tag 0.1.23 -> OCI index sha256:0a28d031..., linux/amd64 manifest sha256:3aca6131...,
# image config label org.opencontainers.image.revision = the tag's commit. To upgrade, change the reference below
# and rebuild; the RUN checks fail the build if a route or file the wrapper relies on has moved.
# Persistence is declared in template.json (Railway volume at /data); this file declares no Docker volume.

FROM ghcr.io/modelflare-ai/anymodel-bot:0.1.23@sha256:0a28d03181a14fb8f05d5ef9386d19108be18a5b8342cb398063d44aec00b43c

USER root

RUN set -eu; \
    apt-get -o Acquire::Retries=5 update; \
    apt-get -o Acquire::Retries=5 install -y --no-install-recommends ffmpeg python3-venv; \
    rm -rf /var/lib/apt/lists/*; \
    ffmpeg -hide_banner -version >/dev/null; \
    ffprobe -hide_banner -version >/dev/null; \
    python3 -m venv /tmp/venv-check; \
    /tmp/venv-check/bin/python -m pip --version; \
    rm -rf /tmp/venv-check

COPY railway/amb-railway railway/amb-railway.mjs /opt/amb-railway/

ENV AMB_DATA_DIR=/data \
    AMB_UI_PORT=3600 \
    PORT=3600

# Build-time checks: the wrapper's own syntax, and every upstream behaviour it relies on at the pinned version.
RUN set -eu; \
    chown -R root:root /opt/amb-railway; \
    chmod 0755 /opt/amb-railway /opt/amb-railway/amb-railway; \
    chmod 0644 /opt/amb-railway/amb-railway.mjs; \
    sh -n /opt/amb-railway/amb-railway; \
    node --check /opt/amb-railway/amb-railway.mjs; \
    test "$(id -u node)" = 1000; \
    test -x /usr/bin/setpriv; \
    test -x /usr/bin/bwrap; \
    test -x /usr/bin/timeout; \
    test -x /app/bin/magpie; \
    test -f /app/dist/src/main.js; \
    test -f /app/ui/botkit/kit.css; \
    d=/app/dist/src; \
    grep -qF 'env.AMB_UI_TOKEN' "$d/config.js"; \
    grep -qF 'url.pathname.startsWith("/amb/botapp/") && (req.method === "GET" || req.method === "HEAD")' "$d/web/server.js"; \
    grep -qF 'if (kind === "kit")' "$d/web/botapp.js"; \
    grep -qF 'req.headers["x-amb-token"] === token' "$d/web/server.js"; \
    grep -qF 'p === "/status" && m === "GET"' "$d/web/server.js"; \
    grep -qF 'seg[0] === "official"' "$d/web/server.js"; \
    grep -qF 'sub === "login/complete"' "$d/web/server.js"; \
    grep -qF 'LOCK_FILE = "anymodel.lock"' "$d/store/lock.js"; \
    for id in $(node /opt/amb-railway/amb-railway.mjs key-ids); do \
      grep -qF "{ id: \"$id\"," "$d/official-providers.js" || { echo "provider id $id missing upstream" >&2; exit 1; }; \
    done; \
    node /opt/amb-railway/amb-railway.mjs tz Europe/Berlin; \
    if node /opt/amb-railway/amb-railway.mjs tz Not/AZone; then echo "tz check accepts invalid zones" >&2; exit 1; fi

EXPOSE 3600

# Railway's podman-init is PID 1 and reaps orphaned tool processes; the wrapper exec's into the app.
ENTRYPOINT ["/opt/amb-railway/amb-railway"]
CMD []
