# NOTICE: AnyModelBot template

## Software deployed

| Component | Source | License | How it is used |
|---|---|---|---|
| AnyModelBot | https://github.com/modelflare-ai/AnyModelBot, release `v0.1.23` = commit `74b7687a4ecd4794f2b4ddfc431e10a175107533` (2026-11-06); image `ghcr.io/modelflare-ai/anymodel-bot:0.1.23@sha256:0a28d03181a14fb8f05d5ef9386d19108be18a5b8342cb398063d44aec00b43c` | MIT License, Copyright (c) 2026 anymodel bot contributors (repository `LICENSE`) | Used unmodified as the base image, pulled from upstream's registry when Railway builds the service. Software bundled in the image (the magpie gateway, the DeepSeek Harness agent runtime, Node.js packages, Debian packages and the components listed in upstream's `THIRD_PARTY_NOTICES_en.md` and `LICENSES/`) keeps its own licenses. |
| FFmpeg | Debian bookworm package `ffmpeg` and its libraries, installed with apt at build time | Debian's build: GPL-2+ / LGPL-2.1+ (see `/usr/share/doc/*/copyright` in the image) | Installed unmodified so the Film Studio and PPT Master bots can render media, as upstream documents for their use. |
| python3-venv | Debian bookworm package `python3-venv` (Python 3.11 `venv` with bundled pip wheels) | Python Software Foundation License; pip and setuptools MIT | Installed unmodified so bots can create Python virtual environments. |

MIT License text: https://github.com/modelflare-ai/AnyModelBot/blob/v0.1.23/LICENSE
Third-party notices: https://github.com/modelflare-ai/AnyModelBot/blob/v0.1.23/THIRD_PARTY_NOTICES_en.md

The listing icon is AnyModelBot's own app icon (`assets/icons/256x256.png`), loaded from the repository at the pinned commit. The AnyModelBot name and logo identify the software this template deploys. This is a community template and is not affiliated with or endorsed by AnyModelBot's authors, Modelflare or Havenbyte LLC, or any model provider or chat platform named in the README (OpenAI, Anthropic, Google, xAI, DeepSeek, Mistral, Moonshot AI, Z.ai, Alibaba Cloud, MiniMax, Telegram, Slack, Discord, Feishu, WeChat, Notion). Those are third-party services with their own accounts, terms and charges.

## Template files

All template files were written for this package: TEMPLATE.md, template.json, README.md, this NOTICE, `services/anymodelbot/Dockerfile`, `services/anymodelbot/railway/amb-railway` and `services/anymodelbot/railway/amb-railway.mjs`. No upstream file or text was copied into them. The wrapper calls AnyModelBot's own HTTP API at runtime (`GET /amb/api/status`, `GET /amb/api/official`, `PUT /amb/api/official/{id}`, documented in upstream's development guide) and reads the data-dir lock format from upstream's `src/store/lock.ts`.

## Upstream files checked (tag `v0.1.23`, checked 2026-11-07)

The 36 repository files below are byte-identical between the local copy and `gh api repos/modelflare-ai/AnyModelBot/contents/{path}?ref=v0.1.23`.

- Deployment: `Dockerfile`, `.dockerignore`, `.env.example`, `package.json`, `.gitmodules`, `LICENSE`, `THIRD_PARTY_NOTICES_en.md`
- Documentation: `README.md` (Chinese) and `README_en.md`, `docs/development_en.md` (Docker, Modelflare sign-in, official API keys, sandbox, computer use, channels), `docs/privacy_en.md`, `CHANGELOG_en.md`
- Source: `src/config.ts` (environment variables, `AMB_UI_TOKEN`), `src/main.ts`, `src/app.ts` (start order, official keys), `src/web/server.ts` (token check, `/amb/healthz` behind the token, unauthenticated `/amb/botapp/` static files, manual Modelflare sign-in, official key API), `src/web/botapp.ts`, `src/account/oauth.ts` and `src/account/manager.ts` (PKCE loopback sign-in and paste-back), `src/official-providers.ts`, `src/store/lock.ts`, `src/magpie/supervisor.ts`, `src/agent/host.ts` (agent environment, bubblewrap shim), `src/agent/peer-guard.ts`, `src/botkit/config.ts`, `src/i18n/index.ts`, `src/core/quiet.ts`, `src/log.ts`, `src/modelflare.ts`, `src/botkit/catalog.ts`, `ui/screens/onboarding.js`, `ui/main.js`, `ui/botkit/kit.css`, `bots/printfilm/bot.json`, `bots/printfilm/skills/printfilm/SKILL.md` and `bots/ppt-master/skills/ppt-master/requirements.txt` (FFmpeg and Python requirements)
- Image: GHCR index for tag `0.1.23`, linux/amd64 manifest `sha256:3aca6131…` and config (user `node`, `WORKDIR /app`, `AMB_*` defaults, `VOLUME /data`, revision label = the tag's commit, built 2026-11-06). Seven layers downloaded with digest check and listed to confirm `/usr/bin/setpriv`, `/usr/bin/bwrap`, `/app/bin/magpie`, `/usr/bin/timeout`, Python 3.11 without `ensurepip`, no FFmpeg, `app/ui/botkit/kit.css` (identical to the repository file) and the compiled strings the Dockerfile's build checks grep for. Nothing from the image is redistributed.

## Market templates reviewed

None: `_market/` for this app is empty and the task brief reports no AnyModelBot template on Railway's marketplace (not re-queried; no Railway API calls in this round).
