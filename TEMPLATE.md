# AnyModelBot Personal AI Bots on Any Model: Railway template spec

## Listing

| Field | Value |
|---|---|
| Name | **AnyModelBot Personal AI Bots on Any Model** (`v0.1` from release `v0.1.23`, the pinned build; no third-party product names) |
| Description | Your own open-source AI bots with memory, background tasks and chat apps. (73 chars) |
| Category | AI/ML |
| Tags | anymodelbot, ai-agents, ai-bots, personal-assistant, telegram-bot, discord-bot, slack-bot, self-hosted, grok-bot-alternative |
| Icon | `https://cdn.jsdelivr.net/gh/modelflare-ai/AnyModelBot@74b7687a4ecd4794f2b4ddfc431e10a175107533/assets/icons/256x256.png` (upstream app icon at the tag commit; HTTP 200 `image/png`) |
| Repo | `baranberkay96/anymodelbot-railway`, service builds from `/services/anymodelbot` |

No `LISTINGS.md` entry exists for this app; name and description were chosen here. The README says "community template" and names Modelflare only where needed to explain the second model option.

## Feasibility: what runs in a container

Read from upstream's `README_en.md`, `docs/development_en.md`, `Dockerfile`, `.env.example` and source at v0.1.23 (see NOTICE.md).

| Feature | Upstream Docker image | On Railway |
|---|---|---|
| Web console, bots, memory, groups, rules, background tasks, outbox | yes | **Works** (one Node process tree, SQLite on `/data`) |
| Model gateway (magpie, bundled Go binary on 127.0.0.1) | yes | **Works** |
| Own official API keys (10 providers, fixed endpoints) | yes, entered in the UI | **Works**; this template can also take them as variables (below) |
| Modelflare sign-in (OIDC + PKCE, loopback redirect) | paste-back flow for Docker | **Works headless**: the browser lands on `http://127.0.0.1:{port}/callback?...`, the user pastes that link into the console (`POST /amb/api/account/login/complete`, same state/PKCE checks, 10 min) |
| Agent runtime (DeepSeek Harness), file and shell tools | yes | **Works**; sandboxed "Workspace" mode needs bubblewrap (user namespaces) or Landlock, unverified on Railway (wrapper logs a probe) |
| Channels: Telegram (long polling), Slack (Socket Mode), Discord (Gateway), Feishu (long connection), WeChat (iLink QR) | yes | **Works**, outbound only, no webhook or public port needed |
| Image / video generation | Modelflare only | Works with a Modelflare account |
| Ready-made bots (Discover catalog, signed downloads from anymodel.bot) | yes | Works; Film Studio and PPT Master need FFmpeg / Python venv, **added by this template** |
| Web search (free Exa MCP / Bing / DuckDuckGo, or keyed providers) | yes | Works; free engines may rate-limit datacenter IPs (upstream falls back between them) |
| Notion: token / one-click OAuth | yes / loopback redirect | Token works. One-click redirects to `http://127.0.0.1:3600/oauth/notion/callback`; README says use the token option |
| Computer use (Cua Driver, screen/mouse/keyboard, local apps) | not in the image | **Not available**: needs a desktop session (DISPLAY/Wayland or a signed-in Windows/macOS session) |
| Tray, autostart, window zoom, update check, "open folder", system proxy, PowerShell 7 install, macOS Codex bridge | desktop only | Not applicable |

Verdict: **feasible**, one service. Nothing needs privileges Railway lacks.

## Base market templates and improvements

No AnyModelBot template exists on Railway's marketplace (`_market/` empty; task brief). The base is upstream's own `docker run -p 3600:3600 -v amb-data:/data ghcr.io/modelflare-ai/anymodel-bot`. Improvements for Railway:

1. **Pinned** `0.1.23` by OCI index digest (upstream's instructions use the moving `latest`).
2. **Volume ownership**: Railway volumes are root-owned, the image runs as `node` (uid 1000) and would fail to write `/data`. The wrapper starts as root, hands `/data` to `node` (only entries with another owner), then `exec`s the app as `node` with `setpriv --no-new-privs`. No `RAILWAY_RUN_UID=0`.
3. **Token from a variable**: upstream reads `AMB_UI_TOKEN` (env beats `config.json`); the template generates it with `secret(48, alnum)` and builds `AMB_LOGIN_URL` from it, so nobody needs `docker exec`/`railway ssh` to read `/data/ui-token`.
4. **Healthcheck that works with the token**: `/amb/healthz` sits behind the token check (401 without it). The template probes `/amb/botapp/kit/kit.css`, a static file upstream serves without the token (no user data). The web server starts only after the gateway start attempt (`App.start()`), so the probe means the same as `/amb/healthz`.
5. **Stale lock after redeploys**: upstream's data-dir lock (`/data/anymodel.lock`) is only taken over automatically after 3 minutes when the holder's hostname differs, so every redeploy after a hard stop would crash-loop for up to 3 minutes. A Railway volume is attached to one deployment at a time, so the wrapper removes a lock held by another host (or by a pid that is not a running `dist/src/main.js` here) before start.
6. **Provider keys as optional variables** (server-friendly default), connected through the app's own API, never left in the app's environment.
7. **FFmpeg + python3-venv** for the Film Studio and PPT Master bots (upstream lists them as prerequisites; the published image has neither).
8. **Dual-stack bind** `::` (image default `0.0.0.0`), `AMB_LANG=en` (Docker default is Simplified Chinese when `LANG` is unset), `TZ` validated (rules and quiet hours follow it), prewarm off below 1 GiB, draining 15 s (the app force-exits after 10 s).
9. Every deploy-form value fails open with a log line (Rule 8.29): bad `PORT` → 3600, bad/empty `AMB_UI_TOKEN` → upstream's generated `/data/ui-token`, bad `TZ` → UTC, bad keys → skipped, unknown `AMB_LANG` → upstream falls back.

## Pinned versions

| Component | Reference | Version / date | Checked |
|---|---|---|---|
| AnyModelBot image | `ghcr.io/modelflare-ai/anymodel-bot:0.1.23@sha256:0a28d03181a14fb8f05d5ef9386d19108be18a5b8342cb398063d44aec00b43c` (OCI index; amd64 `sha256:3aca6131…`, arm64 `sha256:758961ac…`) | release v0.1.23 = commit `74b7687a` (= label `org.opencontainers.image.revision`), image built 2026-11-06, published 2026-11-06 | 2026-11-07 |
| Base OS in the image | Debian 12.15 (bookworm), Node.js 22.23.4, Python 3.11, bubblewrap, git | from the image | 2026-11-07 |
| FFmpeg, python3-venv | Debian bookworm apt, unpinned | current bookworm build at build time | n/a |

`0.1.23` and `latest` pointed at the same index on 2026-11-07. The GHCR tag has no `v` prefix (`v0.1.23` is 404). Upstream releases often: 18 releases from v0.1.5 (2026-10-30) to v0.1.23 (2026-11-06).

## Architecture

```
Browser ──HTTPS──► Railway edge ──► AnyModelBot  [::]:3600  (public domain, token cookie / x-amb-token)
                                      │  podman-init (PID 1)
                                      └─ node dist/src/main.js   (user node, exec'd by amb-railway)
                                           ├─ magpie gateway      127.0.0.1:{random}  ── provider APIs / Modelflare
                                           ├─ DSH agent process per bot (lazy; env replaced, keys never passed)
                                           │     └─ bash/python/ffmpeg tools in /data/workspaces/{bot}
                                           └─ channels: Telegram, Slack, Discord, Feishu, WeChat (outbound)
                                    amb-railway.mjs seed (root, detached, short-lived) ── PUT /amb/api/official/{id} on 127.0.0.1
                                    /data (Railway volume): anymodel.db, config.json, magpie/, dsh/, workspaces/, logs/, ui-token
```

## Service: AnyModelBot

| Setting | Value |
|---|---|
| Source | repo `baranberkay96/anymodelbot-railway`, `/services/anymodelbot` (Dockerfile: `FROM` the pinned digest, `USER root`, apt FFmpeg + python3-venv, wrapper in `/opt/amb-railway`, build-time checks) |
| Start | image `ENTRYPOINT /opt/amb-railway/amb-railway` (no start command) |
| Healthcheck | `GET /amb/botapp/kit/kit.css` on `PORT=3600`, timeout 300 s |
| Domain | public, target port 3600 |
| Volume | `/data` |
| Restart | `ALWAYS`, 1 replica, draining 15 s |

Variables: `PORT=3600`; `AMB_UI_TOKEN=${{secret(48, alnum)}}`; `AMB_LOGIN_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/?token=${{AMB_UI_TOKEN}}`; optional `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`, `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`; `AMB_LANG=en`; `TZ=UTC`; `RAILWAY_DEPLOYMENT_DRAINING_SECONDS=15`. Also read if added: `MOONSHOT_API_KEY`, `ZAI_API_KEY`, `DASHSCOPE_API_KEY`, `MINIMAX_API_KEY`, and upstream's own `AMB_*` settings (`.env.example`). No required inputs.

## Start wrapper (`services/anymodelbot/railway/`)

| Step | Behaviour |
|---|---|
| Port / host | `PORT` validated (digits, 1-65535, else 3600) and copied to `AMB_UI_PORT`; `AMB_UI_HOST=::`, or `0.0.0.0` if the kernel has no IPv6 |
| Volume | `AMB_DATA_DIR=/data`; `find /data -xdev` entries not owned by `node:node` → `chown -h` (first boot: the volume root) |
| Lock | `amb-railway.mjs lock`: remove `/data/anymodel.lock` unless its holder is this hostname and a live pid whose cmdline contains `dist/src/main.js` |
| Token | `AMB_UI_TOKEN` must be 24-512 of `[A-Za-z0-9._~-]` (URL- and cookie-safe); else unset with a log line, and upstream generates `/data/ui-token`. The token is never printed |
| TZ | validated with Node's `Intl`; invalid → UTC |
| Memory | logs the cgroup limit; below 1 GiB warns and sets `AMB_AGENT_PREWARM=0` unless set |
| Sandbox probe | `bwrap --ro-bind / / /bin/true` as `node` (10 s timeout); logs whether bubblewrap works and what to do if not |
| Keys | non-empty provider variables go to `amb-railway.mjs seed`, started with `env -i` as a detached root process, then the variables are unset. The seeder waits (≤15 min) for `GET /amb/api/status` → gateway `running`, lists `GET /amb/api/official`, skips providers already connected with the same last 4 characters, and `PUT`s the others (4 tries on 5xx/network, none on 4xx). Keys and token are redacted from every log line; nothing fails the deploy |
| Exec | `cd /app`; `exec setpriv --reuid=node --regid=node --init-groups --no-new-privs env HOME=/home/node … node dist/src/main.js` (if not started as root: plain `exec node …`) |

## Auth design

- Upstream enforces token access whenever it listens on a non-loopback address: every request needs cookie `amb_token={token}` or header `x-amb-token`; `/?token={token}` sets the cookie (HttpOnly, SameSite=Lax, 400 days) and redirects without the token. No accounts, no sign-up.
- Unauthenticated by upstream design: `GET`/`HEAD` under `/amb/botapp/` (static UI kit, vendor files, signed catalog bot UIs and thumbnails; no user data) and `GET /oauth/notion/callback` (one-time OAuth state is the credential). Everything else, including `/amb/healthz` and the whole API, returns 401 without the token. No auth front is needed.
- Token: 48 alphanumeric characters from `secret()` (≈285 bits). Rotating = change `AMB_UI_TOKEN`, redeploy; old cookies stop matching. Upstream redacts the token from its logs.
- The app also refuses API calls coming from its own agent processes (`peer-guard.ts`), so a bot cannot approve itself or read settings through the API.

## Model options

1. **Own API keys (default for servers)**: variables at deploy or **Settings → Models → Use your own API key**. Requests go from the bundled gateway straight to the provider's fixed endpoint (`src/official-providers.ts`); the provider bills. Keys are stored in the gateway's isolated config on `/data`. Limits: no image/video generation, no bot budgets, no server-side compaction.
2. **Modelflare account**: sign-in via the paste-back flow above; a per-device key is issued and stored on `/data`. Needed for image and video generation and per-bot budgets. Modelflare keeps request logs (upstream's privacy notes).
3. Not exposed: `AMB_MAGPIE_BASE_URL` (any OpenAI-compatible endpoint), which upstream marks as development/testing and which disables the gateway, sign-in and official keys.

## Security model

- Public surface: the console on the Railway domain, token-gated as above. Magpie, the agent bridge and the OAuth listener bind 127.0.0.1.
- Processes: app, gateway and agents run as `node` with `no_new_privs`; root is used only by the wrapper and the short-lived key seeder.
- Bots: default preset "Workspace" (writes only in the bot's workspace, approval cards otherwise; the bubblewrap shim also hides `/data` from commands). If neither bubblewrap nor Landlock works on Railway, such commands fail closed; "Full access" then runs commands unsandboxed as `node`, which can read all of `/data` (database, channel tokens, gateway keys, Modelflare refresh token) and reach the internet and this project's private network. Documented in the README.
- Secrets on Railway: `AMB_UI_TOKEN`, `AMB_LOGIN_URL` and key variables are readable by anyone with project access. Key variables are removed from the app's environment; the token stays there because upstream reads it from env.
- Channel access: a bot answers only its owner and allow-listed people by default (upstream `src/core/access.ts`).

## First login

1. Deploy. First build: pull of the ~270 MB image plus FFmpeg (a few minutes).
2. Healthy → open `AMB_LOGIN_URL` (Variables tab).
3. With key variables: deploy log shows `keys: X connected`, the console skips onboarding (it treats official keys as connected). Without: onboarding offers "Use your own API key" or Modelflare sign-in (paste-back).
4. Pick a default model, chat with the default bot; optional: Settings → Connections for Telegram/Slack/Discord/Feishu/WeChat.

## Resource estimate

Railway prices: RAM $10/GB-month, vCPU $20/vCPU-month, volume $0.15/GB-month. **Not measured** (no container run in this round); estimated from the process layout (Node main process, Go gateway, one Node agent process per active bot, prewarmed for the default bot).

| Part | Idle RAM / CPU | Typical RAM / CPU | Notes |
|---|---|---|---|
| Main process (console, scheduler, channels, SQLite) | 0.15-0.2 GB / ~0.01 | 0.2-0.3 GB / 0.05 | |
| magpie gateway | 0.02-0.05 GB / ~0 | 0.05 GB / 0.02 | |
| Agent processes (DSH) | 0.15-0.25 GB (prewarmed default bot) | 0.2-0.3 GB per active bot / 0.05-0.2 | catalog bots exit when idle; recycled after 100 task sessions |
| Tools (Python, FFmpeg renders) | 0 | bursts 0.3-1 GB / up to 1+ vCPU | Film Studio renders |
| Volume | 0.1-0.3 GB | 1-5 GB | workspaces, media, venvs; logs capped at 12 MB |

Total: **idle ≈ $5/month** (≈0.45 GB, 0.02 vCPU, 0.3 GB volume), **typical ≈ $12-16/month** (0.8-1.2 GB, 0.15-0.25 vCPU, 2 GB volume), heavy media use $25-40, plus model usage billed by the provider or Modelflare. Minimum plan: **Hobby** recommended. Trial (1 GB) should boot and carry one bot with light use (wrapper warns below 1 GiB and turns prewarm off); Free (0.5 GB) is not expected to fit an agent turn.

## Verification results (2026-11-07, static only; no Docker, not deployed)

| Check | Result |
|---|---|
| GitHub: tag `v0.1.23` → annotated tag `7ddd6ea7` → commit `74b7687a`; release published 2026-11-06, not a pre-release; repo MIT, 2,734 stars, created 2026-10-27 | pass |
| Local upstream copy vs `?ref=v0.1.23` for the 36 files cited in NOTICE.md | byte-identical |
| GHCR: `0.1.23` → index `0a28d031…` (sha256 of the fetched index matches), amd64 manifest `3aca6131…`, config (user node, env, VOLUME /data, revision label = tag commit) | as pinned; `latest` = same index |
| Image layers (7 downloaded, digests verified): `setpriv`, `runuser`, `timeout`, `find`, `hostname` in the base; `/app/bin/magpie`; `bwrap`, `python3.11`, `git` in the apt layer, no `ensurepip`, no FFmpeg; `/data` 1000:1000; `kit.css` identical to the repo; compiled `server.js`/`config.js`/`botapp.js`/`lock.js`/`official-providers.js` contain every string the Dockerfile greps for (all 10 provider ids) | pass |
| `amb-railway`: `sh -n`, `dash -n`, `bash -n`; run (non-root path, macOS, dash and bash) with defaults, bad `PORT` (`abc`, `0`, `9999999`), short/invalid/empty token, invalid `TZ`, key variables: falls back as designed, keys and `AMB_LOGIN_URL` absent from the app's environment, seeder started | pass |
| `amb-railway.mjs`: `node --check`; seeder vs a fake console API: token from env and from a file that appears late, gateway `starting`→`running`, skip same-tail key, 200, 400 (no retry), 502→retry→200, whitespace key skipped, external mode, 401; no key or token in output; `lock` (none, foreign host, dead pid, garbage, unreadable); `tz` (valid, invalid, empty, injection string) | pass (the "lock kept for a live app" case needs Linux `/proc`, not run) |
| `template.json`: JSON parse, `_tools/to_serialized.py` converts (1 service, volume, domain on 3600), healthchecked service sets `PORT` = target port, no required input | pass |
| README 7.9k chars, Rule 5 headings, no `<placeholders>`; description 73 chars; all links and the icon 200 | pass |
| Docker build, container run, Railway behaviour | **not run** |

## Verification checklist

- [ ] Build log: `FROM …@sha256:0a28d031…` pulled; apt installs FFmpeg and python3-venv; venv check prints a pip version; every grep check passes.
- [ ] Deploy log: `console token: from AMB_UI_TOKEN`, `memory limit: … MiB`, `agent sandbox: …`, `model keys: none set …`, `starting AnyModelBot on [::]:3600`; healthy on `/amb/botapp/kit/kit.css`.
- [ ] `curl -i https://{domain}/` → 401; `curl -i https://{domain}/amb/healthz` → 401; `curl -I "https://{domain}/?token={token}"` → 302 with `set-cookie: amb_token=`.
- [ ] Open `AMB_LOGIN_URL`: onboarding appears; "Use your own API key" with a real key lists models; send a message to the default bot (agent turn works, see Activity).
- [ ] Redeploy with `OPENAI_API_KEY` (or another) set: log shows `keys: OPENAI_API_KEY connected (openai, N models)`; second redeploy shows `already connected; unchanged`; `railway ssh` → `tr '\0' '\n' < /proc/$(pgrep -f dist/src/main.js)/environ | grep -c _API_KEY` → 0.
- [ ] Modelflare paste-back sign-in completes from a second device's browser.
- [ ] In a bot with the Workspace preset: `ls ~; touch x; touch /tmp/y` → sandbox works or a clear sandbox error; note which (bubblewrap vs Landlock vs none) and update the README if needed.
- [ ] Telegram bot token in Settings → Connections; message the bot from Telegram; reply arrives.
- [ ] Create a rule ("every 5 minutes, tell me the time"), check it runs in the configured `TZ`.
- [ ] Redeploy twice in a row (also once with "Restart" during a turn): no `DataDirLocked` crash loop; log shows the stale-lock removal; chats, bots, keys persist.
- [ ] Film Studio `doctor` reports FFmpeg/ffprobe found; PPT Master builds a small deck.
- [ ] Trial-sized limits (`serviceInstanceLimitsUpdate` 1 GB): boots, prewarm on; at 0.5 GB the warning and prewarm-off path appear and one chat turn either fits or the README claim is corrected.

## Open questions

- **Never built or run.** Most likely failure points: the apt step on Railway's builder; `setpriv --init-groups` under Railway's runtime; Node binding `::` (falls back to `0.0.0.0` only when IPv6 is absent).
- **Agent sandbox on Railway**: bubblewrap needs unprivileged user namespaces, Landlock needs kernel support; both unknown here. If neither works, the default Workspace preset cannot run commands until a bot is switched to Full access.
- **Healthcheck path** depends on upstream keeping `/amb/botapp/kit/` static files unauthenticated; the build grep fails early if the check in `server.js` changes.
- **Memory** figures are estimates; DSH's first start loads many runtime files (upstream mentions slow first starts).
- **Free web search** engines may block or rate-limit Railway IP ranges; keyed providers or SearXNG are the fallback (upstream setting).
- **Notion one-click** on a server: editing the `127.0.0.1` callback address to the Railway domain should complete it (the callback path is public by design), but it was not tested; the README recommends the token option.
- **Upstream pace**: 18 releases in 8 days, young product; re-check routes, env names and the lock format on every bump.
