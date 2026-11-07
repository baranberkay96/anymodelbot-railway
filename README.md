# Deploy and Host AnyModelBot with Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/anymodelbot-v01-personal-ai-bots-on-any-model?referralCode=20H68q)

AnyModelBot is an open-source (MIT) app for personal AI bots. Each bot has its own persona, model, workspace and memory, works on tasks in the background and answers you in the browser or in Telegram, Slack, Discord, Feishu or WeChat. This community template runs AnyModelBot v0.1.23 as an always-on server, protected by an access token from the first minute.

## About Hosting AnyModelBot

AnyModelBot is built local-first: a Node.js server with a web console, SQLite, a bundled model gateway and an agent runtime that runs commands and edits files in each bot's workspace. Upstream publishes a Docker image for servers; this template uses it unchanged and adds a small start wrapper for Railway. Chats, memory, workspaces, channel tokens and model keys live on a Railway volume at `/data`. The console only answers requests that carry the generated access token. On a server, rules, background tasks and chat channels keep working when your computer is off.

## Common Use Cases

- A personal assistant you message from Telegram, Slack or Discord that remembers your preferences
- Scheduled rules such as "every morning at 8, check this page and tell me only if something changed"
- Background research and reports that arrive in your chat when they are done
- Several bots on different models in one place, or together in a group chat
- Documents, slide decks and short videos with the ready-made bots from Discover

## Dependencies for AnyModelBot Hosting

- A model source, one of:
  - **Your own API key** from OpenAI, Anthropic, Google Gemini, xAI, DeepSeek or Mistral, set as a variable at deploy (Kimi, GLM, Qwen and MiniMax keys go in **Settings → Models**). Requests go straight to that provider, which bills you.
  - **A Modelflare account**, a pay-per-use model gateway (AnyModelBot is published under its GitHub organization, `modelflare-ai`). Image and video generation and per-bot budgets are only available this way.
- A Railway volume at `/data` (included)
- Optional: a Telegram, Slack or Discord bot token, a Feishu app, or a WeChat account to scan with

### Deployment Dependencies

- AnyModelBot (MIT): https://github.com/modelflare-ai/AnyModelBot
- Release v0.1.23: https://github.com/modelflare-ai/AnyModelBot/releases/tag/v0.1.23
- Container image: https://github.com/modelflare-ai/AnyModelBot/pkgs/container/anymodel-bot
- Docker and configuration guide: https://github.com/modelflare-ai/AnyModelBot/blob/v0.1.23/docs/development_en.md
- What stays on the server and what leaves it: https://github.com/modelflare-ai/AnyModelBot/blob/v0.1.23/docs/privacy_en.md
- Modelflare: https://modelflare.dev
- Railway volumes: https://docs.railway.com/reference/volumes

### Implementation Details

| Service | Source | Purpose |
|---|---|---|
| AnyModelBot | Dockerfile in `services/anymodelbot` on `ghcr.io/modelflare-ai/anymodel-bot:0.1.23` (pinned by digest), plus FFmpeg and python3-venv | Web console and API, bots, agent runtime, channels, rules and the built-in model gateway. Port 3600, volume `/data`. Healthcheck `/amb/botapp/kit/kit.css`, a static file: every other path needs the token |

**First login**

1. Deploy. The first build takes a few minutes.
2. When the service is healthy, open `AMB_LOGIN_URL` from the service's **Variables** tab. AnyModelBot stores the token in a cookie and removes it from the address bar. Without the token the console answers 401.
3. If you set a key variable, your models are already connected (the deploy log shows `keys: ... connected`). Otherwise choose **Use your own API key** or sign in to Modelflare.
4. Pick a default model and message your first bot.

**Signing in to Modelflare on a server**: start the sign-in in the console and finish it in the browser. The browser then lands on an `http://127.0.0.1:...` address that does not load. That is expected: copy the whole address and paste it into the box the console shows (upstream's flow for Docker; it expires after 10 minutes).

**API keys as variables**: at each start, every non-empty key variable is checked with the provider and connected through AnyModelBot's own API, then removed from the app's environment. The variable wins over a key edited in the app; clear it to manage that key only in **Settings → Models**. A wrong key is logged and skipped, the deploy still succeeds. `MOONSHOT_API_KEY` (Kimi), `ZAI_API_KEY` (GLM), `DASHSCOPE_API_KEY` (Qwen) and `MINIMAX_API_KEY` work the same way for those providers' global endpoints.

**Chat channels**: **Settings → Connections**. Telegram, Slack and Discord need only a token, Feishu uses a long connection and WeChat shows a QR code to scan. No public webhook is needed. By default a bot answers only its owner (the WeChat account that scanned, elsewhere the first person to message it) and people you allow.

**What does not run in a container**

- Computer use (screen, mouse, keyboard, your local apps) needs a desktop session and is not in the server image.
- Desktop-app parts: tray, autostart, update notices, opening folders, Windows PowerShell setup and the macOS bridge.
- Bots read, write and run commands in this container (`/data/workspaces`), not on your own computer.
- Notion's one-click authorization returns to `127.0.0.1`; use the Notion token option instead.

**Security**

- Every console request needs the token, except static UI files and the Notion callback. To rotate it, change `AMB_UI_TOKEN` and redeploy: every browser is signed out. Keep `AMB_LOGIN_URL` private. If `AMB_UI_TOKEN` is empty or invalid, AnyModelBot generates a token in `/data/ui-token` instead (`railway ssh`, then `cat /data/ui-token`).
- AnyModelBot runs as the image's unprivileged user. Bots write only in their own workspace and ask before anything outside. That mode needs a kernel sandbox (bubblewrap or Landlock); the start log says whether bubblewrap works here. If bot commands fail with a sandbox error, switch that bot to **Full access**: its commands then run unsandboxed in the container and can read everything in `/data`, including keys, channel tokens and chats.
- Model keys, the Modelflare sign-in and channel tokens are stored on the volume. Anyone with access to this Railway project can read its variables and volume.

**Time zone and language**: set `TZ` (for example `Europe/Berlin`) so rules and quiet hours (22:00 to 08:00) follow your clock. `AMB_LANG` sets the console language; it can also be changed in Settings.

**Custom domain**: attach it to the service and open `https://{your-domain}/?token={your-token}` once. The old link keeps working on the Railway domain.

**Scaling and cost**: one replica (SQLite and a host lock on the volume). Give the service more memory when several bots work at once. Estimated: idle about 0.4-0.5 GB RAM (around $5/month), typical use $12-16/month, plus model usage billed by your provider. Hobby or above is recommended. Trial's 1 GB should carry one bot with light use; the Free plan's 0.5 GB is likely too small. Do not enable app sleeping: rules and channels need the service running.

**Pinning and upgrades**: the Dockerfile pins the upstream image by tag and digest. To upgrade, read upstream's changelog, back up `/data`, change the reference and redeploy. The build fails early if a route the start wrapper relies on has moved.

This is a community template, not affiliated with AnyModelBot's authors or Modelflare.

### Why Deploy AnyModelBot on Railway?

AnyModelBot's rules, background tasks and chat channels only work while it runs, and on a laptop they stop when the lid closes. Railway keeps it running with a persistent volume, HTTPS, logs and automatic restarts, in your own account, with the model provider you choose.
