"use strict";

const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const repoDir = path.resolve(__dirname, "..");
const viteBin = path.join(repoDir, "node_modules/vite/bin/vite.js");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function commandPath(command) {
  const result = spawnSync("bash", ["-lc", `command -v ${command}`], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    commandPath("google-chrome"),
    commandPath("chromium"),
    commandPath("chromium-browser"),
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("Chromeが見つかりません。CHROME_BINに実行ファイルを指定してください。");
}

async function waitForHttp(url) {
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // 起動待ち中は接続できないことがある。
    }
    await sleep(100);
  }
  throw new Error(`previewサーバーに接続できません: ${url}`);
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

async function waitForDevtools(port) {
  for (let i = 0; i < 80; i++) {
    try {
      const pages = await getJson(`http://127.0.0.1:${port}/json/list`);
      const page = pages.find((item) => item.type === "page");
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // ChromeのDevTools起動待ち。
    }
    await sleep(100);
  }
  throw new Error("Chrome DevToolsに接続できません。");
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 0;
    this.pending = new Map();
    this.events = [];
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => this.onMessage(event);
    });
  }

  onMessage(event) {
    const msg = JSON.parse(event.data);
    if (msg.id && this.pending.has(msg.id)) {
      this.pending.get(msg.id)(msg);
      this.pending.delete(msg.id);
      return;
    }
    this.events.push(msg);
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve) => this.pending.set(id, resolve));
  }

  close() {
    try {
      this.ws.close();
    } catch {
      // 終了時のclose失敗は検証結果に影響しない。
    }
  }
}

function collectIssues(events) {
  const issues = [];
  for (const msg of events) {
    if (msg.method === "Runtime.exceptionThrown") {
      const detail = msg.params.exceptionDetails;
      issues.push(`例外: ${detail.exception?.description || detail.text || "unknown"}`);
    }
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      const text = msg.params.args.map((arg) => arg.value || arg.description || "").join(" ");
      issues.push(`console.error: ${text}`);
    }
    if (msg.method === "Network.responseReceived") {
      const response = msg.params.response;
      if (response.status >= 400 && !response.url.endsWith("/favicon.ico")) {
        issues.push(`HTTP ${response.status}: ${response.url}`);
      }
    }
  }
  return issues;
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.result.exceptionDetails) {
    throw new Error(result.result.exceptionDetails.exception?.description || result.result.exceptionDetails.text);
  }
  return result.result.result.value;
}

async function waitFor(client, expression, label) {
  for (let i = 0; i < 80; i++) {
    if (await evaluate(client, expression)) return;
    await sleep(100);
  }
  throw new Error(`${label}を確認できません。`);
}

async function run() {
  if (!fs.existsSync(path.join(repoDir, "dist/index.html"))) {
    throw new Error("dist/index.htmlがありません。先に npm run build を実行してください。");
  }

  const appPort = await freePort();
  const debugPort = await freePort();
  const appUrl = `http://127.0.0.1:${appPort}/`;
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "makai-smoke-"));

  const preview = spawn(process.execPath, [
    viteBin,
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(appPort),
    "--strictPort",
  ], { cwd: repoDir, stdio: ["ignore", "pipe", "pipe"] });

  const chrome = spawn(findChrome(), [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  let previewLog = "";
  let chromeLog = "";
  preview.stdout.on("data", (data) => { previewLog += data.toString(); });
  preview.stderr.on("data", (data) => { previewLog += data.toString(); });
  chrome.stderr.on("data", (data) => { chromeLog += data.toString(); });

  let client = null;
  try {
    await waitForHttp(appUrl);
    client = new CdpClient(await waitForDevtools(debugPort));
    await client.open();
    await client.send("Runtime.enable");
    await client.send("Network.enable");
    await client.send("Page.enable");
    await client.send("Page.navigate", { url: appUrl });
    await waitFor(client, "document.readyState === 'complete' && !!document.querySelector('canvas')", "初回ロード");

    const loaded = await evaluate(client, `({
      title: document.title,
      app: !!document.querySelector("#app"),
      canvas: !!document.querySelector("canvas"),
      state: globalThis.MakaiDefense?.current?.gameState || null
    })`);
    if (loaded.title !== "迷宮を守る" || !loaded.app || !loaded.canvas || loaded.state !== "title") {
      throw new Error(`初回ロード状態が不正です: ${JSON.stringify(loaded)}`);
    }

    await evaluate(client, `document.getElementById("startBtn").click()`);
    await waitFor(client, `globalThis.MakaiDefense?.current?.gameState === "playing"`, "開始ボタン後のplaying状態");
    const playing = await evaluate(client, `({
      state: globalThis.MakaiDefense.current.gameState,
      coreHP: globalThis.MakaiDefense.current.coreHP,
      nutrients: globalThis.MakaiDefense.current.nutrients,
      startHidden: document.getElementById("startOverlay").classList.contains("hidden")
    })`);
    if (playing.state !== "playing" || !playing.startHidden || playing.coreHP <= 0 || playing.nutrients < 0) {
      throw new Error(`開始後状態が不正です: ${JSON.stringify(playing)}`);
    }

    await evaluate(client, `document.getElementById("devPanel").open = true`);
    await evaluate(client, `document.getElementById("exportDevJsonBtn").click()`);
    const devJson = await evaluate(client, `(() => {
      const value = document.getElementById("devJsonOutput").value;
      const parsed = JSON.parse(value);
      const startNut = document.querySelector('[data-dev-path="constants.START_NUT"]');
      const startNutDefault = startNut.closest(".dev-field").querySelector(".dev-default");
      startNut.value = "26";
      startNut.dispatchEvent(new Event("input", { bubbles: true }));
      return {
        hasValue: value.length > 100,
        chance: parsed.constants.AMULET_WAVE_DROP_CHANCE,
        hasKinds: !!parsed.kinds?.slime,
        status: document.getElementById("devStatus").textContent,
        defaultLabel: startNutDefault.textContent,
        defaultDiff: startNutDefault.classList.contains("dev-default-diff"),
      };
    })()`);
    if (!devJson.hasValue || devJson.chance !== 0.35 || !devJson.hasKinds || devJson.status !== "JSONを出力しました" || !devJson.defaultLabel.includes("初期 25") || !devJson.defaultDiff) {
      throw new Error(`開発JSON出力が不正です: ${JSON.stringify(devJson)}`);
    }

    await evaluate(client, `(() => {
      const game = globalThis.MakaiDefense.current;
      game.setRandom(() => 0);
      game.wave = 1;
      game.gameState = "playing";
      game.heroes.length = 0;
      game.spawnQueue.length = 0;
      game.settleWave();
    })()`);
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "amuletChoice" && !document.getElementById("amuletChoiceOverlay").classList.contains("hidden") && document.querySelectorAll("[data-amulet-choice]").length === 3`, "お守り3択表示");
    const offer = await evaluate(client, `({
      state: globalThis.MakaiDefense.current.gameState,
      choices: globalThis.MakaiDefense.current.amuletOffer?.choices || [],
      cards: document.querySelectorAll("[data-amulet-choice]").length,
      label: document.getElementById("waveLabel").textContent,
      timer: document.getElementById("waveTimer").textContent
    })`);
    if (offer.state !== "amuletChoice" || offer.cards !== 3 || offer.choices.join(",") !== "family,dogtag,lastStick" || offer.label !== "お守り選択" || offer.timer !== "時間停止中") {
      throw new Error(`お守り3択表示が不正です: ${JSON.stringify(offer)}`);
    }
    await evaluate(client, `document.querySelector('[data-amulet-choice="dogtag"]').click()`);
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "playing" && document.getElementById("amuletChoiceOverlay").classList.contains("hidden")`, "お守り選択後の再開");
    const amuletResult = await evaluate(client, `({
      amulets: globalThis.MakaiDefense.current.amulets,
      bar: document.getElementById("amuletBar").textContent,
      icons: document.querySelectorAll(".amulet-icon").length,
      buttonLabel: document.querySelector('[data-amulet-id="dogtag"]')?.getAttribute("aria-label") || "",
      popupExists: !!document.getElementById("amuletPopup")
    })`);
    if (!amuletResult.amulets.includes("dogtag") || amuletResult.bar.includes("ドッグタグ") || amuletResult.icons < 1 || !amuletResult.buttonLabel.includes("ドッグタグ") || !amuletResult.popupExists) {
      throw new Error(`お守り選択後状態が不正です: ${JSON.stringify(amuletResult)}`);
    }
    const popupResult = await evaluate(client, `new Promise((resolve) => {
      const button = document.querySelector('[data-amulet-id="dogtag"]');
      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      button.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 7, clientX: x, clientY: y, pointerType: "touch" }));
      setTimeout(() => {
        button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 7, clientX: x, clientY: y, pointerType: "touch" }));
        const popup = document.getElementById("amuletPopup");
        resolve({
          hidden: popup.classList.contains("hidden"),
          text: popup.textContent,
          selection: String(getSelection()),
        });
      }, 650);
    })`);
    if (popupResult.hidden || !popupResult.text.includes("ドッグタグ") || !popupResult.text.includes("体力が全快") || popupResult.selection) {
      throw new Error(`お守り長押しポップアップが不正です: ${JSON.stringify(popupResult)}`);
    }

    const issues = collectIssues(client.events);
    if (issues.length) throw new Error(`ブラウザ実行エラー:\n${issues.join("\n")}`);

    console.log("OK: ブラウザ初回ロード、開始、開発JSON出力、お守り3択、長押しポップアップを検査しました");
  } catch (error) {
    if (previewLog) console.error(previewLog.slice(-2000));
    if (chromeLog) console.error(chromeLog.slice(-2000));
    throw error;
  } finally {
    if (client) client.close();
    preview.kill("SIGTERM");
    chrome.kill("SIGTERM");
    await sleep(300);
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {
      // Chrome終了直後は一時ファイルが残ることがある。
    }
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
