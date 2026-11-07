// AnyModelBot on Railway: helper for the start wrapper (amb-railway). Node built-ins only.
//
//   key-vars        print the provider-key variable names this template reads (space separated)
//   key-ids         print the AnyModelBot provider ids they map to (build-time check)
//   lock <file>     remove a data-dir lock left behind by an earlier container
//   tz <zone>       exit 0 when <zone> is a time zone Node's Intl accepts, 1 otherwise
//   seed            connect the provider keys from the environment through AnyModelBot's own API
//
// Written for this template; it only calls the app's documented HTTP API on 127.0.0.1.

import fs from "node:fs";
import os from "node:os";

// Variable name -> AnyModelBot official provider id (src/official-providers.ts, v0.1.23).
const PROVIDERS = [
  ["OPENAI_API_KEY", "openai"],
  ["ANTHROPIC_API_KEY", "anthropic"],
  ["GEMINI_API_KEY", "google"],
  ["XAI_API_KEY", "xai"],
  ["DEEPSEEK_API_KEY", "deepseek"],
  ["MISTRAL_API_KEY", "mistral"],
  ["MOONSHOT_API_KEY", "moonshot"],
  ["ZAI_API_KEY", "zai"],
  ["DASHSCOPE_API_KEY", "qwen"],
  ["MINIMAX_API_KEY", "minimax"],
];

const READY_TIMEOUT_MS = 15 * 60_000;
const POLL_MS = 3_000;
const PUT_TRIES = 4;
const PUT_RETRY_MS = 15_000;
const PUT_TIMEOUT_MS = 120_000;

const log = (msg) => console.log(`amb-railway: ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Keep secrets out of anything we print. */
function redact(text, secrets) {
  let out = String(text ?? "");
  for (const s of secrets) if (s && s.length >= 4) out = out.split(s).join("***");
  return out.replace(/\s+/g, " ").slice(0, 300);
}

function cleanLock(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (e) {
    if (e.code !== "ENOENT") log(`lock: cannot read ${file} (${e.code}); leaving it to AnyModelBot`);
    return;
  }
  let holder = {};
  try {
    holder = JSON.parse(raw) ?? {};
  } catch {
    holder = {};
  }
  const pid = Number(holder.pid) || 0;
  const host = String(holder.host ?? "");
  if (host === os.hostname() && pid > 0 && runsApp(pid)) {
    log(`lock: held by a running AnyModelBot (pid ${pid}) in this container; not touched`);
    return;
  }
  // A Railway volume is attached to one deployment at a time, so any other holder is gone.
  fs.rmSync(file, { force: true });
  log(`lock: removed a stale data-dir lock (host ${host || "?"}, pid ${pid || "?"}) left by an earlier container`);
}

function runsApp(pid) {
  try {
    return fs.readFileSync(`/proc/${pid}/cmdline`, "utf8").includes("dist/src/main.js");
  } catch {
    return false;
  }
}

function validZone(zone) {
  if (!zone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

function wantedKeys(env) {
  const out = [];
  for (const [name, id] of PROVIDERS) {
    const key = String(env[name] ?? "").trim();
    if (!key) continue;
    if (key.length > 1024 || /\s/.test(key)) {
      log(`keys: ${name} is not a single-line key of at most 1024 characters; skipped`);
      continue;
    }
    out.push({ name, id, key });
  }
  return out;
}

function readToken(env) {
  if (env.AMB_SEED_TOKEN) return env.AMB_SEED_TOKEN;
  try {
    return fs.readFileSync(env.AMB_SEED_TOKEN_FILE || "/data/ui-token", "utf8").trim();
  } catch {
    return "";
  }
}

async function call(base, token, method, path, body, timeoutMs = 10_000) {
  const res = await fetch(base + path, {
    method,
    headers: { "x-amb-token": token, "x-amb-lang": "en", ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { status: res.status, data };
}

/** Wait until the console answers and the built-in gateway runs; returns the token or "" to give up. */
async function waitReady(env, base) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let lastState = "";
  while (Date.now() < deadline) {
    const token = readToken(env);
    if (token) {
      try {
        const r = await call(base, token, "GET", "/status");
        const state = String(r.data?.gateway?.state ?? "");
        if (r.status === 200 && state === "running") return token;
        if (r.status === 200 && state === "external") {
          log("keys: AnyModelBot uses an external endpoint (AMB_MAGPIE_BASE_URL); provider keys are not used");
          return "";
        }
        if (r.status === 401) {
          log("keys: the console refused the access token; keys not connected");
          return "";
        }
        if (state && state !== lastState) log(`keys: waiting for the model gateway (${state})`);
        lastState = state || lastState;
      } catch {
        // console not listening yet
      }
    }
    await sleep(POLL_MS);
  }
  log("keys: AnyModelBot did not become ready within 15 minutes; add the keys in Settings > Models instead");
  return "";
}

async function connectOne(base, token, want, current) {
  const tail = want.key.length > 4 ? want.key.slice(-4) : "";
  if (current?.connected && tail && current.keyTail === tail) {
    log(`keys: ${want.name} already connected (${want.id}); unchanged`);
    return;
  }
  for (let attempt = 1; attempt <= PUT_TRIES; attempt++) {
    try {
      const r = await call(base, token, "PUT", `/official/${encodeURIComponent(want.id)}`, { key: want.key }, PUT_TIMEOUT_MS);
      if (r.status === 200) {
        const n = Array.isArray(r.data?.models) ? r.data.models.length : 0;
        log(`keys: ${want.name} connected (${want.id}, ${n} models)`);
        return;
      }
      const why = redact(r.data?.error || `HTTP ${r.status}`, [want.key, token]);
      if (r.status >= 400 && r.status < 500) {
        log(`keys: ${want.name} was not accepted (${want.id}): ${why}`);
        return;
      }
      log(`keys: ${want.name} attempt ${attempt}/${PUT_TRIES} failed: ${why}`);
    } catch (e) {
      log(`keys: ${want.name} attempt ${attempt}/${PUT_TRIES} failed: ${redact(e?.message, [want.key, token])}`);
    }
    if (attempt < PUT_TRIES) await sleep(PUT_RETRY_MS);
  }
  log(`keys: ${want.name} not connected; check the key, then add it in Settings > Models`);
}

async function seed(env) {
  const wanted = wantedKeys(env);
  if (!wanted.length) return;
  const port = Number(env.AMB_SEED_PORT) || 3600;
  const base = `http://127.0.0.1:${port}/amb/api`;
  log(`keys: will connect ${wanted.map((w) => w.name).join(", ")} once AnyModelBot is ready`);
  const token = await waitReady(env, base);
  if (!token) return;
  let providers = [];
  try {
    const r = await call(base, token, "GET", "/official");
    providers = Array.isArray(r.data?.providers) ? r.data.providers : [];
  } catch (e) {
    log(`keys: cannot list providers: ${redact(e?.message, [token])}`);
  }
  for (const want of wanted) {
    await connectOne(base, token, want, providers.find((p) => p?.id === want.id));
  }
}

async function main(argv) {
  const [cmd, arg] = argv;
  if (cmd === "key-vars") return void console.log(PROVIDERS.map(([v]) => v).join(" "));
  if (cmd === "key-ids") return void console.log(PROVIDERS.map(([, id]) => id).join(" "));
  if (cmd === "lock") return void cleanLock(arg || "/data/anymodel.lock");
  if (cmd === "tz") process.exit(validZone(arg) ? 0 : 1);
  if (cmd === "seed") return seed(process.env);
  console.error(`amb-railway.mjs: unknown command ${cmd ?? "(none)"}`);
  process.exit(2);
}

main(process.argv.slice(2)).catch((e) => {
  log(`helper failed: ${redact(e?.message, [])}`);
  process.exit(1);
});
