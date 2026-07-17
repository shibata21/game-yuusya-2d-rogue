"use strict";

const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { PNG } = require("pngjs");

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

async function waitForEvent(client, method, predicate, label, fromIndex = 0) {
  for (let i = 0; i < 80; i++) {
    const event = client.events.slice(fromIndex).find((msg) => msg.method === method && (!predicate || predicate(msg.params)));
    if (event) return event;
    await sleep(100);
  }
  throw new Error(`${label}を確認できません。`);
}

async function updateStoredProgress(client, patch) {
  const result = await evaluate(client, `new Promise((resolve) => {
    const request = indexedDB.open("makaiDefense.storage.v1", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("entries")) request.result.createObjectStore("entries");
    };
    request.onerror = () => resolve({ ok: false, error: "open" });
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("entries", "readwrite");
      const store = tx.objectStore("entries");
      const get = store.get("makaiDefense.progress.v1");
      let next = null;
      get.onerror = () => { next = ${JSON.stringify(patch)}; store.put(JSON.stringify(next), "makaiDefense.progress.v1"); };
      get.onsuccess = () => {
        let current = {};
        try { current = JSON.parse(get.result || "{}"); } catch { current = {}; }
        next = { ...current, ...${JSON.stringify(patch)} };
        store.put(JSON.stringify(next), "makaiDefense.progress.v1");
      };
      tx.oncomplete = () => { db.close(); resolve({ ok: true, progress: next }); };
      tx.onerror = () => { db.close(); resolve({ ok: false, error: "write" }); };
      tx.onabort = () => { db.close(); resolve({ ok: false, error: "abort" }); };
    };
  })`);
  if (!result?.ok) throw new Error(`進行データを書き込めません: ${JSON.stringify(result)}`);
  return result.progress;
}

async function readStoredProgress(client) {
  return evaluate(client, `new Promise((resolve) => {
    const request = indexedDB.open("makaiDefense.storage.v1", 1);
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("entries", "readonly");
      const get = tx.objectStore("entries").get("makaiDefense.progress.v1");
      get.onerror = () => resolve(null);
      get.onsuccess = () => {
        try { resolve(JSON.parse(get.result || "{}")); } catch { resolve(null); }
      };
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    };
  })`);
}

async function waitForStoredProgress(client, predicate, label) {
  for (let i = 0; i < 80; i++) {
    const progress = await readStoredProgress(client);
    if (progress && predicate(progress)) return progress;
    await sleep(100);
  }
  throw new Error(`${label}を確認できません。`);
}

async function reloadAndWaitForReady(client, label, ignoreCache = false) {
  const marker = `smoke-${Date.now()}-${Math.random()}`;
  await evaluate(client, `globalThis.__smokeReloadMarker = ${JSON.stringify(marker)}`);
  await client.send("Page.reload", { ignoreCache });
  await waitFor(
    client,
    `globalThis.__smokeReloadMarker !== ${JSON.stringify(marker)} && document.readyState === "complete" && globalThis.MakaiDefense?.current?.gameState === "title" && !document.getElementById("startBtn")?.disabled && document.getElementById("loadOverlay")?.classList.contains("hidden")`,
    label,
  );
}

async function inspectDeckLayout(client, width, height) {
  await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 2, mobile: true });
  await evaluate(client, `new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
  const layout = await evaluate(client, `(() => {
    const grid = document.getElementById("homeBody");
    const cards = [...grid.querySelectorAll(".home-card")];
    const cardRects = cards.map((card) => card.getBoundingClientRect());
    const bodyWidths = cards.map((card) => card.querySelector(".home-card-body")?.getBoundingClientRect().width || 0);
    const horizontal = [grid, ...cards, ...cards.map((card) => card.querySelector(".home-card-body"))]
      .filter(Boolean)
      .every((node) => getComputedStyle(node).writingMode === "horizontal-tb");
    const oneColumn = cardRects.every((rect, index) => {
      if (index === 0) return true;
      const previous = cardRects[index - 1];
      return Math.abs(rect.left - cardRects[0].left) <= 1 && rect.top >= previous.bottom - 1;
    });
    const contentFits = cards.every((card) => {
      const body = card.querySelector(".home-card-body");
      const detail = card.querySelector(".home-card-detail");
      const action = card.querySelector(".home-card-action");
      return card.scrollWidth <= card.clientWidth + 1
        && (!body || body.scrollWidth <= body.clientWidth + 1)
        && (!detail || detail.scrollWidth <= detail.clientWidth + 1)
        && (!action || action.scrollWidth <= action.clientWidth + 1);
    });
    const noPageOverflow = document.documentElement.scrollWidth <= innerWidth + 1
      && cardRects.every((rect) => rect.left >= -1 && rect.right <= innerWidth + 1);
    return {
      width: innerWidth,
      height: innerHeight,
      cards: cards.length,
      horizontal,
      oneColumn,
      minBodyWidth: Math.round(Math.min(...bodyWidths)),
      contentFits,
      noPageOverflow,
      gridColumns: getComputedStyle(grid).gridTemplateColumns,
      pageScrollWidth: document.documentElement.scrollWidth,
    };
  })()`);
  return { requestedWidth: width, requestedHeight: height, ...layout };
}

async function canvasPixelStats(client) {
  const rect = await evaluate(client, `(() => {
    const box = document.querySelector("canvas").getBoundingClientRect();
    return { x: box.left + scrollX, y: box.top + scrollY, width: box.width, height: box.height };
  })()`);
  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { ...rect, scale: 1 },
  });
  if (!screenshot.result?.data) throw new Error("canvasのスクリーンショットを取得できません。");
  const png = PNG.sync.read(Buffer.from(screenshot.result.data, "base64"));
  const colors = new Set();
  let sampled = 0;
  let bright = 0;
  let minLuma = 255;
  let maxLuma = 0;
  for (let y = 0; y < png.height; y += 2) {
    for (let x = 0; x < png.width; x += 2) {
      const offset = (y * png.width + x) * 4;
      const r = png.data[offset];
      const g = png.data[offset + 1];
      const b = png.data[offset + 2];
      const a = png.data[offset + 3];
      if (a === 0) continue;
      const luma = Math.round(r * 0.2126 + g * 0.7152 + b * 0.0722);
      colors.add(`${r >> 4},${g >> 4},${b >> 4}`);
      sampled += 1;
      if (luma >= 48) bright += 1;
      minLuma = Math.min(minLuma, luma);
      maxLuma = Math.max(maxLuma, luma);
    }
  }
  return {
    width: png.width,
    height: png.height,
    colors: colors.size,
    brightRatio: sampled ? bright / sampled : 0,
    lumaRange: maxLuma - minLuma,
  };
}

async function advanceDialogueTo(client, expectedState, label) {
  for (let i = 0; i < 20; i++) {
    const state = await evaluate(client, `globalThis.MakaiDefense.current.gameState`);
    if (state !== "dialogue") break;
    await evaluate(client, `document.getElementById("dialogueAdvanceBtn").click()`);
    await sleep(60);
  }
  await waitFor(client, `globalThis.MakaiDefense.current.gameState === ${JSON.stringify(expectedState)}`, label);
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
    await client.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await client.send("Fetch.enable", { patterns: [{ urlPattern: "*assets/pixel/tiles.png*", requestStage: "Request" }] });
    await client.send("Page.navigate", { url: appUrl });
    const pausedTiles = await waitForEvent(
      client,
      "Fetch.requestPaused",
      (params) => params.request.url.includes("/assets/pixel/tiles.png"),
      "初回タイル素材の読み込み保留",
    );
    await waitFor(client, `!!globalThis.MakaiDefense?.current && !!document.querySelector("canvas") && document.getElementById("startBtn")?.textContent.includes("素材")`, "初回素材の読み込み表示");
    const loading = await evaluate(client, `(() => {
      const start = document.getElementById("startBtn");
      const overlay = document.getElementById("loadOverlay");
      start.click();
      return {
        state: globalThis.MakaiDefense.current.gameState,
        startDisabled: start.disabled,
        startBusy: start.getAttribute("aria-busy"),
        startText: start.textContent.trim(),
        overlayHidden: overlay.classList.contains("hidden"),
        overlayBusy: overlay.getAttribute("aria-busy"),
        loadText: document.getElementById("loadText").textContent.trim(),
      };
    })()`);
    if (loading.state !== "title" || !loading.startDisabled || loading.startBusy !== "true" || !loading.startText.includes("素材を読み込み中") || loading.overlayHidden || loading.overlayBusy !== "true" || !loading.loadText.includes("素材を読み込み中")) {
      throw new Error(`初回素材読み込み保留中の表示が不正です: ${JSON.stringify(loading)}`);
    }
    await client.send("Fetch.continueRequest", { requestId: pausedTiles.params.requestId });
    await client.send("Fetch.disable");
    await waitFor(client, `document.readyState === "complete" && !!document.querySelector("canvas") && !document.getElementById("startBtn").disabled && document.getElementById("loadOverlay").classList.contains("hidden")`, "初回ロード完了");

    const loaded = await evaluate(client, `({
      title: document.title,
      app: !!document.querySelector("#app"),
      canvas: !!document.querySelector("canvas"),
      canvasRatio: (() => {
        const rect = document.querySelector("canvas")?.getBoundingClientRect();
        return rect ? rect.width / rect.height : 0;
      })(),
      state: globalThis.MakaiDefense?.current?.gameState || null,
      startDisabled: document.getElementById("startBtn").disabled,
      startBusy: document.getElementById("startBtn").getAttribute("aria-busy"),
      startText: document.getElementById("startBtn").textContent.trim(),
      startHidden: document.getElementById("startBtn").classList.contains("hidden"),
      loadHidden: document.getElementById("loadOverlay").classList.contains("hidden"),
      tabs: [...document.querySelectorAll("[data-home-tab]")].map((button) => button.textContent.trim()),
      menuVisible: !document.querySelector(".home-tabs").classList.contains("hidden"),
      oldBottom: !!document.getElementById("codexBtn") || !!document.getElementById("loopSelect") || !!document.getElementById("soundPanel")
    })`);
    if (loaded.title !== "迷宮を守る" || !loaded.app || !loaded.canvas || Math.abs(loaded.canvasRatio - 528 / 768) > 0.002 || loaded.state !== "title" || loaded.startDisabled || loaded.startBusy !== "false" || loaded.startText !== "防衛開始" || !loaded.startHidden || !loaded.loadHidden || !loaded.menuVisible || loaded.oldBottom || loaded.tabs.join("/") !== "防衛/モンスターデッキ/設定") {
      throw new Error(`初回ロード状態が不正です: ${JSON.stringify(loaded)}`);
    }

    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    const failedLoadEventStart = client.events.length;
    await client.send("Fetch.enable", { patterns: [{ urlPattern: "*assets/pixel/tiles.png*", requestStage: "Request" }] });
    await client.send("Page.reload", { ignoreCache: true });
    const failedTiles = await waitForEvent(
      client,
      "Fetch.requestPaused",
      (params) => params.request.url.includes("/assets/pixel/tiles.png"),
      "初回タイル素材の失敗検査",
      failedLoadEventStart,
    );
    await client.send("Fetch.fulfillRequest", {
      requestId: failedTiles.params.requestId,
      responseCode: 404,
      responseHeaders: [{ name: "Content-Type", value: "image/png" }],
      body: "",
    });
    await client.send("Fetch.disable");
    await waitFor(
      client,
      `globalThis.MakaiDefense?.current?.gameState === "title" && document.getElementById("startBtn")?.disabled && document.getElementById("loadText")?.textContent.includes("素材を読み込めませんでした") && !document.getElementById("loadRetryBtn")?.classList.contains("hidden")`,
      "素材失敗時の再読み込み表示",
    );
    const failedLoad = await evaluate(client, `(() => {
      const start = document.getElementById("startBtn");
      const overlay = document.getElementById("loadOverlay");
      const retry = document.getElementById("loadRetryBtn");
      start.click();
      return {
        state: globalThis.MakaiDefense.current.gameState,
        startDisabled: start.disabled,
        startBusy: start.getAttribute("aria-busy"),
        overlayHidden: overlay.classList.contains("hidden"),
        overlayBusy: overlay.getAttribute("aria-busy"),
        loadText: document.getElementById("loadText").textContent.trim(),
        retryHidden: retry.classList.contains("hidden"),
        retryText: retry.textContent.trim(),
      };
    })()`);
    if (failedLoad.state !== "title" || !failedLoad.startDisabled || failedLoad.startBusy !== "true" || failedLoad.overlayHidden || failedLoad.overlayBusy !== "false" || failedLoad.loadText !== "素材を読み込めませんでした" || failedLoad.retryHidden || failedLoad.retryText !== "再読み込み") {
      throw new Error(`素材失敗時の表示が不正です: ${JSON.stringify(failedLoad)}`);
    }
    const retryMarker = `smoke-retry-${Date.now()}-${Math.random()}`;
    await evaluate(client, `globalThis.__smokeRetryMarker = ${JSON.stringify(retryMarker)}; document.getElementById("loadRetryBtn").click()`);
    await waitFor(
      client,
      `globalThis.__smokeRetryMarker !== ${JSON.stringify(retryMarker)} && document.readyState === "complete" && globalThis.MakaiDefense?.current?.gameState === "title" && !document.getElementById("startBtn")?.disabled && document.getElementById("loadOverlay")?.classList.contains("hidden")`,
      "素材失敗後の再読み込み復旧",
    );
    client.events.length = 0;
    await client.send("Network.setCacheDisabled", { cacheDisabled: false });

    await evaluate(client, `document.querySelector('[data-home-tab="deck"]').click()`);
    await waitFor(client, `document.querySelectorAll(".home-card").length === 20`, "モンスターデッキ表示");
    const initialDeck = await evaluate(client, `(() => {
      const cards = [...document.querySelectorAll(".home-card")];
      const slime = cards.find((card) => card.textContent.includes("スライム"));
      const back = document.querySelector("[data-home-back]");
      const backRect = back?.getBoundingClientRect();
      return {
        width: innerWidth,
        menuHidden: document.querySelector(".home-tabs").classList.contains("hidden"),
        backText: back?.textContent.trim() || "",
        backHeight: Math.round(backRect?.height || 0),
        cards: cards.length,
        detailButtons: document.querySelectorAll("[data-deck-family-detail]").length,
        actionButtons: document.querySelectorAll(".home-card-action").length,
        slimeText: slime?.textContent || "",
        actionsNestedInDetail: [...document.querySelectorAll(".home-card-action")].some((button) => button.closest(".home-card-detail")),
        codexTabs: document.querySelectorAll("[data-codex-tab]").length,
      };
    })()`);
    if (!initialDeck.menuHidden || initialDeck.backText !== "← ホームへ戻る" || initialDeck.backHeight < 44 || initialDeck.width !== 390 || initialDeck.cards !== 20 || initialDeck.detailButtons !== 20 || initialDeck.actionButtons !== 20 || !initialDeck.slimeText.includes("選択中") || initialDeck.actionsNestedInDetail || initialDeck.codexTabs !== 0) {
      throw new Error(`モンスターデッキ表示が不正です: ${JSON.stringify(initialDeck)}`);
    }

    const deckLayouts = [];
    for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
      deckLayouts.push(await inspectDeckLayout(client, width, height));
    }
    const invalidLayout = deckLayouts.find((layout) => layout.width !== layout.requestedWidth || layout.height !== layout.requestedHeight || layout.cards !== 20 || !layout.horizontal || !layout.oneColumn || layout.minBodyWidth < 80 || !layout.contentFits || !layout.noPageOverflow);
    if (invalidLayout) {
      throw new Error(`モンスターデッキのレスポンシブ表示が不正です: ${JSON.stringify(deckLayouts)}`);
    }
    await client.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await evaluate(client, `new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);

    await evaluate(client, `(() => {
      const body = document.getElementById("homeBody");
      body.scrollTop = 180;
      document.querySelector('[data-deck-family-detail="bug_beetle"]').click();
    })()`);
    await waitFor(client, `!!document.querySelector('[data-deck-detail="bug_beetle"]')`, "デッキ系統詳細表示");
    const detailLayouts = [];
    for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
      await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 2, mobile: true });
      await evaluate(client, `new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
      detailLayouts.push(await evaluate(client, `(() => {
        const detail = document.querySelector(".deck-detail");
        const radar = document.querySelector(".monster-radar");
        const rect = detail.getBoundingClientRect();
        return {
          width: innerWidth,
          height: innerHeight,
          right: Math.round(rect.right),
          left: Math.round(rect.left),
          radar: !!radar,
          polygon: radar?.querySelector(".radar-value")?.getAttribute("points") || "",
          stages: document.querySelectorAll("[data-deck-stage]").length,
          backHeight: Math.round(document.querySelector("[data-deck-list-back]").getBoundingClientRect().height),
          noPageOverflow: document.documentElement.scrollWidth <= innerWidth + 1,
        };
      })()`));
    }
    if (detailLayouts.some((layout) => layout.width <= 0 || layout.stages !== 3 || layout.backHeight < 44 || !layout.radar || !layout.polygon || layout.left < -1 || layout.right > layout.width + 1 || !layout.noPageOverflow)) {
      throw new Error(`デッキ詳細のレスポンシブ表示が不正です: ${JSON.stringify(detailLayouts)}`);
    }
    await client.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await evaluate(client, `document.querySelector('[data-deck-stage="2"]').click()`);
    const deckEvolution = await evaluate(client, `({
      active: document.querySelector('[data-deck-stage="2"]').classList.contains("active"),
      name: document.querySelector(".monster-creature-copy h4").textContent,
      raw: document.querySelector(".monster-raw-stats").textContent,
      normalized: document.querySelector(".monster-normalized-stats").textContent
    })`);
    if (!deckEvolution.active || !deckEvolution.name.includes("城塞甲虫") || !deckEvolution.raw.includes("移動間隔") || !deckEvolution.normalized.includes("5")) {
      throw new Error(`デッキ進化切替が不正です: ${JSON.stringify(deckEvolution)}`);
    }
    await evaluate(client, `document.querySelector("[data-deck-list-back]").click()`);
    await waitFor(client, `document.querySelectorAll(".home-card").length === 20 && document.getElementById("homeBody").scrollTop >= 150`, "デッキ一覧のスクロール復元");
    await evaluate(client, `document.querySelector("[data-home-back]").click()`);
    await waitFor(client, `!document.querySelector(".home-tabs").classList.contains("hidden")`, "デッキから初期画面へ戻る操作");
    await evaluate(client, `document.querySelector('[data-home-tab="defense"]').click()`);
    const loopUi = await evaluate(client, `(() => ({
      controlsSelect: !!document.querySelector(".controls select"),
      firstHomeSelect: !!document.getElementById("homeLoopSelect"),
      menuHidden: document.querySelector(".home-tabs").classList.contains("hidden"),
      backVisible: !!document.querySelector("[data-home-back]"),
      startVisible: !document.getElementById("startBtn").classList.contains("hidden"),
    }))()`);
    if (loopUi.controlsSelect || loopUi.firstHomeSelect || !loopUi.menuHidden || !loopUi.backVisible || !loopUi.startVisible) {
      throw new Error(`周回UIの配置が不正です: ${JSON.stringify(loopUi)}`);
    }

    await evaluate(client, `document.querySelector("[data-home-back]").click(); document.querySelector('[data-home-tab="settings"]').click()`);
    await waitFor(client, `!!document.getElementById("soundFields") && document.querySelectorAll("[data-audio-volume]").length === 4`, "音量表示");
    await evaluate(client, `(() => {
      const voice = document.querySelector('[data-audio-volume="voice"]');
      voice.value = "40";
      voice.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await sleep(350);
    const soundSettings = await evaluate(client, `new Promise((resolve) => {
      const request = indexedDB.open("makaiDefense.audio.v1", 1);
      request.onerror = () => resolve({ ok: false, error: "open" });
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("settings", "readonly");
        const get = tx.objectStore("settings").get("volume");
        get.onerror = () => resolve({ ok: false, error: "get" });
        get.onsuccess = () => {
          const value = get.result || {};
          resolve({
            ok: Math.round((value.voice || 0) * 100) === 40,
            voice: value.voice,
            label: document.getElementById("voiceVolumeValue").textContent,
          });
        };
        tx.oncomplete = () => db.close();
        tx.onerror = () => db.close();
      };
    })`);
    if (!soundSettings.ok || soundSettings.label !== "40%") {
      throw new Error(`音量保存が不正です: ${JSON.stringify(soundSettings)}`);
    }

    await evaluate(client, `document.querySelector('[data-settings-tab="dev"]').click()`);
    await waitFor(client, `!!document.getElementById("devFields") && !!document.querySelector('[data-dev-path="constants.START_NUT"]')`, "開発表示");
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
        reaperChance: parsed.constants.REAPER_SPAWN_CHANCE,
        hasKinds: !!parsed.kinds?.slime,
        status: document.getElementById("devStatus").textContent,
        defaultLabel: startNutDefault.textContent,
        defaultDiff: startNutDefault.classList.contains("dev-default-diff"),
        defaultColor: getComputedStyle(startNutDefault).color,
      };
    })()`);
    if (!devJson.hasValue || devJson.reaperChance <= 0 || !devJson.hasKinds || devJson.status !== "JSONを出力しました" || !devJson.defaultLabel.includes("初期 25") || !devJson.defaultDiff || devJson.defaultColor !== "rgb(255, 107, 107)") {
      throw new Error(`開発JSON出力が不正です: ${JSON.stringify(devJson)}`);
    }

    await updateStoredProgress(client, {
      coins: 9999,
      activeRun: null,
      unlockedMonsterFamilies: ["moss_shroom"],
      monsterDeck: {},
    });
    await reloadAndWaitForReady(client, "動的アトラス検査前の再読み込み");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await evaluate(client, `document.querySelector('[data-home-tab="deck"]').click()`);
    await waitFor(client, `!!document.querySelector('[data-select-family="moss_shroom"]')`, "菌糸デッキ候補表示");

    const lockedDetailBefore = await evaluate(client, `({
      coins: Number(document.getElementById("homeCoinNum").textContent),
      actionText: document.querySelector('[data-buy-family="moss_virus"]')?.textContent.trim() || "",
    })`);
    await evaluate(client, `document.querySelector('[data-deck-family-detail="moss_virus"]').click()`);
    await waitFor(client, `!!document.querySelector('[data-deck-detail="moss_virus"]')`, "未解放ウイルス詳細表示");
    const lockedDetailAfter = await evaluate(client, `({
      coins: Number(document.getElementById("homeCoinNum").textContent),
      unlockedLabel: document.querySelector(".deck-detail-head span")?.textContent.trim() || "",
      actionInsideDetail: !!document.querySelector('.deck-detail [data-buy-family], .deck-detail [data-select-family]'),
    })`);
    if (lockedDetailBefore.coins !== 9999 || !lockedDetailBefore.actionText.startsWith("解放 ") || lockedDetailAfter.coins !== lockedDetailBefore.coins || lockedDetailAfter.unlockedLabel !== "未解放" || lockedDetailAfter.actionInsideDetail) {
      throw new Error(`未解放詳細と解放操作が競合しています: ${JSON.stringify({ lockedDetailBefore, lockedDetailAfter })}`);
    }
    await evaluate(client, `document.querySelector("[data-deck-list-back]").click()`);
    await waitFor(client, `!!document.querySelector('[data-buy-family="moss_virus"]')`, "未解放詳細から一覧復帰");
    await evaluate(client, `document.querySelector('[data-buy-family="moss_virus"]').click()`);
    await waitFor(client, `document.querySelector('[data-select-family="moss_virus"]')?.textContent.trim() === "入れる" && !document.querySelector("[data-deck-detail]")`, "ウイルス解放操作");
    await waitForStoredProgress(client, (value) => value.coins === 9839 && value.unlockedMonsterFamilies?.includes("moss_virus") && value.monsterDeck?.moss !== "moss_virus", "ウイルス解放の保存");

    const deckCandidate = await evaluate(client, `(() => {
      const button = document.querySelector('[data-select-family="moss_shroom"]');
      const sprite = button.closest(".home-card").querySelector(".home-monster-sprite");
      return { disabled: button.disabled, text: button.textContent.trim(), image: getComputedStyle(sprite).backgroundImage };
    })()`);
    if (deckCandidate.disabled || deckCandidate.text !== "入れる" || !deckCandidate.image.includes("actor_moss_shroom.png")) {
      throw new Error(`菌糸デッキ候補が不正です: ${JSON.stringify(deckCandidate)}`);
    }
    await evaluate(client, `new Promise((resolve) => {
      const button = document.querySelector('[data-select-family="moss_shroom"]');
      const value = getComputedStyle(button.closest(".home-card").querySelector(".home-monster-sprite")).backgroundImage;
      const url = value.slice(5, -2);
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = url;
    })`);
    await evaluate(client, `document.querySelector('[data-select-family="moss_shroom"]').click()`);
    await waitFor(client, `document.querySelector('[data-select-family="moss_shroom"]')?.disabled && document.querySelector('[data-select-family="moss_shroom"]')?.textContent.trim() === "選択中"`, "菌糸デッキ選択");
    await waitForStoredProgress(client, (value) => value.monsterDeck?.moss === "moss_shroom" && value.activeRun === null, "菌糸デッキの保存");

    const actorFetchEventStart = client.events.length;
    await client.send("Fetch.enable", { patterns: [{ urlPattern: "*assets/pixel/actor_moss_shroom.png*", requestStage: "Request" }] });
    await evaluate(client, `document.querySelector("[data-home-back]").click(); document.querySelector('[data-home-tab="defense"]').click()`);
    await evaluate(client, `document.getElementById("startBtn").click()`);
    const pausedActor = await waitForEvent(
      client,
      "Fetch.requestPaused",
      (params) => params.request.url.includes("/assets/pixel/actor_moss_shroom.png"),
      "菌糸アトラスの開始保留",
      actorFetchEventStart,
    );
    await waitFor(client, `globalThis.MakaiDefense?.current?.gameState === "title" && document.getElementById("startBtn").disabled && document.getElementById("startBtn").textContent.trim() === "開始準備中…" && document.getElementById("loadText").textContent.includes("防衛開始の準備中")`, "動的アトラスの開始保留表示");
    const pendingStart = await evaluate(client, `(() => {
      const start = document.getElementById("startBtn");
      const overlay = document.getElementById("loadOverlay");
      return {
        state: globalThis.MakaiDefense.current.gameState,
        startDisabled: start.disabled,
        startBusy: start.getAttribute("aria-busy"),
        startText: start.textContent.trim(),
        startOverlayHidden: document.getElementById("startOverlay").classList.contains("hidden"),
        loadOverlayHidden: overlay.classList.contains("hidden"),
        loadText: document.getElementById("loadText").textContent.trim(),
      };
    })()`);
    const pendingProgress = await readStoredProgress(client);
    if (pendingStart.state !== "title" || !pendingStart.startDisabled || pendingStart.startBusy !== "true" || pendingStart.startText !== "開始準備中…" || pendingStart.startOverlayHidden || pendingStart.loadOverlayHidden || !pendingStart.loadText.includes("防衛開始の準備中") || pendingProgress?.activeRun !== null) {
      throw new Error(`動的アトラス保留中の状態が不正です: ${JSON.stringify({ pendingStart, pendingProgress })}`);
    }
    await client.send("Fetch.continueRequest", { requestId: pausedActor.params.requestId });
    await client.send("Fetch.disable");
    await client.send("Network.setCacheDisabled", { cacheDisabled: false });
    await waitFor(client, `globalThis.MakaiDefense?.current?.gameState === "dialogue" && !document.getElementById("dialogueOverlay").classList.contains("hidden")`, "開始チュートリアル会話表示");
    const introDialogue = await evaluate(client, `({
      state: globalThis.MakaiDefense.current.gameState,
      id: globalThis.MakaiDefense.current.dialogue?.id || "",
      speaker: document.getElementById("dialogueSpeaker").textContent,
      topic: document.getElementById("dialogueTopic").textContent,
      text: document.getElementById("dialogueText").textContent,
      label: document.getElementById("waveLabel").textContent,
      timer: document.getElementById("waveTimer").textContent,
      startHidden: document.getElementById("startOverlay").classList.contains("hidden"),
      eventLayout: document.getElementById("dialogueOverlay").classList.contains("dialogue-event")
    })`);
    if (introDialogue.state !== "dialogue" || introDialogue.id !== "intro" || introDialogue.speaker !== "迷宮王直属幹部" || introDialogue.topic !== "防衛開始" || !introDialogue.text.includes("最下層コア") || introDialogue.label !== "会話中" || introDialogue.timer !== "時間停止中" || !introDialogue.startHidden || introDialogue.eventLayout) {
      throw new Error(`開始チュートリアル会話が不正です: ${JSON.stringify(introDialogue)}`);
    }
    await advanceDialogueTo(client, "playing", "開始チュートリアル後のplaying状態");
    const playing = await evaluate(client, `({
      state: globalThis.MakaiDefense.current.gameState,
      coreHP: globalThis.MakaiDefense.current.coreHP,
      nutrients: globalThis.MakaiDefense.current.nutrients,
      startHidden: document.getElementById("startOverlay").classList.contains("hidden"),
      controlsSelect: !!document.querySelector(".controls select")
    })`);
    if (playing.state !== "playing" || !playing.startHidden || playing.coreHP <= 0 || playing.nutrients < 0 || playing.controlsSelect) {
      throw new Error(`開始後状態が不正です: ${JSON.stringify(playing)}`);
    }
    await sleep(150);
    const canvasStats = await canvasPixelStats(client);
    if (canvasStats.width < 300 || canvasStats.height < 400 || canvasStats.colors < 24 || canvasStats.brightRatio < 0.01 || canvasStats.lumaRange < 40) {
      throw new Error(`開始後のcanvas描画が不正です: ${JSON.stringify(canvasStats)}`);
    }

    const runControlLayouts = [];
    for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
      await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 2, mobile: true });
      await evaluate(client, `(() => {
        const status = document.getElementById("statusToggleBtn");
        if (status.getAttribute("aria-expanded") !== "true") status.click();
      })()`);
      const beforePause = await evaluate(client, `(() => { document.getElementById("quitRunBtn").click(); return globalThis.MakaiDefense.current.waveCountdown; })()`);
      await sleep(180);
      runControlLayouts.push(await evaluate(client, `(() => {
        const panel = document.getElementById("equipmentStatusPanel");
        const overlay = document.getElementById("quitConfirmOverlay");
        const rect = overlay.getBoundingClientRect();
        return {
          width: innerWidth,
          height: innerHeight,
          stats: panel.querySelectorAll(":scope > span").length,
          statsText: panel.textContent,
          statusOpen: !panel.classList.contains("hidden"),
          quitOpen: !overlay.classList.contains("hidden"),
          timer: document.getElementById("waveTimer").textContent,
          countdown: globalThis.MakaiDefense.current.waveCountdown,
          cancelHeight: Math.round(document.getElementById("cancelQuitBtn").getBoundingClientRect().height),
          cancelText: document.getElementById("cancelQuitBtn").textContent.trim(),
          noPageOverflow: document.documentElement.scrollWidth <= innerWidth + 1 && rect.left >= -1 && rect.right <= innerWidth + 1,
        };
      })()`));
      runControlLayouts[runControlLayouts.length - 1].pauseDelta = Math.abs(runControlLayouts[runControlLayouts.length - 1].countdown - beforePause);
      await evaluate(client, `document.getElementById("cancelQuitBtn").click()`);
      await sleep(100);
      const resumed = await evaluate(client, `globalThis.MakaiDefense.current.waveCountdown`);
      if (resumed >= beforePause) throw new Error(`終了確認キャンセル後に時間が再開しません: ${beforePause} -> ${resumed}`);
    }
    const invalidRunControl = runControlLayouts.find((layout) => layout.stats !== 6 || !layout.statsText.includes("土壌") || !layout.statsText.includes("回復") || !layout.statsText.includes("+0%") || !layout.statusOpen || !layout.quitOpen || layout.timer !== "時間停止中" || layout.pauseDelta > 0.01 || layout.cancelHeight < 44 || layout.cancelText !== "← 防衛へ戻る" || !layout.noPageOverflow);
    if (invalidRunControl) throw new Error(`ステータス・終了確認のレスポンシブ表示が不正です: ${JSON.stringify(runControlLayouts)}`);
    await client.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

    await evaluate(client, `(() => {
      const game = globalThis.MakaiDefense.current;
      game.setRandom(() => 0);
      game.wave = 1;
      game.gameState = "playing";
      game.heroes.length = 0;
      game.spawnQueue.length = 0;
      game.settleWave();
    })()`);
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "dialogue" && globalThis.MakaiDefense.current.dialogue?.id === "itemChoice" && !document.getElementById("dialogueOverlay").classList.contains("hidden")`, "装備3択前会話表示");
    const itemDialogue = await evaluate(client, `(() => {
      const overlay = document.getElementById("dialogueOverlay");
      const box = document.getElementById("dialogueAdvanceBtn");
      const overlayRect = overlay.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      return {
        state: globalThis.MakaiDefense.current.gameState,
        speaker: document.getElementById("dialogueSpeaker").textContent,
        hiddenChoice: document.getElementById("itemChoiceOverlay").classList.contains("hidden"),
        label: document.getElementById("waveLabel").textContent,
        timer: document.getElementById("waveTimer").textContent,
        eventLayout: overlay.classList.contains("dialogue-event"),
        centerDelta: Math.round(Math.abs((boxRect.top + boxRect.bottom) / 2 - (overlayRect.top + overlayRect.bottom) / 2)),
        boxMinHeight: parseFloat(getComputedStyle(box).minHeight),
        portraitWidth: parseFloat(getComputedStyle(document.getElementById("dialoguePortrait")).width),
        speakerSize: parseFloat(getComputedStyle(document.getElementById("dialogueSpeaker")).fontSize),
        textSize: parseFloat(getComputedStyle(document.getElementById("dialogueText")).fontSize),
      };
    })()`);
    if (itemDialogue.state !== "dialogue" || itemDialogue.speaker !== "ゴリラおばさん" || !itemDialogue.hiddenChoice || itemDialogue.label !== "会話中" || itemDialogue.timer !== "時間停止中" || !itemDialogue.eventLayout || itemDialogue.centerDelta > 2 || itemDialogue.boxMinHeight < 156 || itemDialogue.portraitWidth < 74 || itemDialogue.speakerSize < 16 || itemDialogue.textSize < 15) {
      throw new Error(`装備3択前会話が不正です: ${JSON.stringify(itemDialogue)}`);
    }
    await advanceDialogueTo(client, "itemChoice", "装備3択前会話後の選択状態");
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "itemChoice" && !document.getElementById("itemChoiceOverlay").classList.contains("hidden") && document.querySelectorAll("[data-item-choice]").length === 3`, "装備3択表示");
    const offer = await evaluate(client, `({
      state: globalThis.MakaiDefense.current.gameState,
      choices: globalThis.MakaiDefense.current.itemOffer?.choices || [],
      cards: document.querySelectorAll("[data-item-choice]").length,
      label: document.getElementById("waveLabel").textContent,
      timer: document.getElementById("waveTimer").textContent
    })`);
    if (offer.state !== "itemChoice" || offer.cards !== 3 || offer.choices.map((item) => item.type).join(",") !== "sand,water,fungus" || offer.choices.some((item) => !item.uid || !item.mods) || offer.label !== "装備選択" || offer.timer !== "時間停止中") {
      throw new Error(`装備3択表示が不正です: ${JSON.stringify(offer)}`);
    }
    await evaluate(client, `document.querySelector('[data-item-choice="' + globalThis.MakaiDefense.current.itemOffer.choices.find((item) => item.type === "sand").uid + '"]').click()`);
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "playing" && document.getElementById("itemChoiceOverlay").classList.contains("hidden") && document.getElementById("itemShopOverlay").classList.contains("hidden")`, "装備選択後の再開");
    const itemResult = await evaluate(client, `({
      equipment: globalThis.MakaiDefense.current.equipment,
      stats: globalThis.MakaiDefense.current.itemStats,
      slots: document.querySelectorAll("#itemBar .equipment-slot").length,
      buttonLabel: document.querySelector('[data-equipment-type="sand"]')?.getAttribute("aria-label") || "",
      popupExists: !!document.getElementById("itemPopup")
    })`);
    if (!itemResult.equipment.sand || itemResult.slots !== 5 || !itemResult.buttonLabel.includes("砂") || itemResult.stats.soil <= 0 || !itemResult.popupExists) {
      throw new Error(`装備選択後状態が不正です: ${JSON.stringify(itemResult)}`);
    }

    await evaluate(client, `(() => {
      const game = globalThis.MakaiDefense.current;
      game.setRandom(() => 0);
      game.wave = 4;
      game.gameState = "playing";
      game.heroes.length = 0;
      game.spawnQueue.length = 0;
      game.settleWave();
    })()`);
    await advanceDialogueTo(client, "itemChoice", "同種装備3択前会話後の選択状態");
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "itemChoice" && globalThis.MakaiDefense.current.itemOffer.choices.some((item) => item.type === "sand")`, "同種装備候補表示");
    const previousSandUid = itemResult.equipment.sand.uid;
    await evaluate(client, `(() => {
      const item = globalThis.MakaiDefense.current.itemOffer.choices.find((entry) => entry.type === "sand");
      document.querySelector('[data-item-choice="' + item.uid + '"]').click();
    })()`);
    const comparison = await evaluate(client, `({
      state: globalThis.MakaiDefense.current.gameState,
      visible: !document.getElementById("equipmentCompareOverlay").classList.contains("hidden"),
      cards: document.querySelectorAll(".equipment-compare-cards article").length,
      totals: document.querySelectorAll(".equipment-total-compare > span").length,
      text: document.getElementById("equipmentCompareBody").textContent,
      uid: globalThis.MakaiDefense.current.equipment.sand.uid,
      backHeight: Math.round(document.getElementById("backToItemChoicesBtn").getBoundingClientRect().height),
      backText: document.getElementById("backToItemChoicesBtn").textContent.trim()
    })`);
    if (comparison.state !== "itemChoice" || !comparison.visible || comparison.cards !== 2 || comparison.totals !== 6 || !comparison.text.includes("装備後の実効値") || comparison.uid !== previousSandUid || comparison.backHeight < 44 || comparison.backText !== "← 選択肢へ戻る") {
      throw new Error(`同種装備比較が不正です: ${JSON.stringify(comparison)}`);
    }
    await evaluate(client, `document.getElementById("backToItemChoicesBtn").click()`);
    await waitFor(client, `document.getElementById("equipmentCompareOverlay").classList.contains("hidden") && globalThis.MakaiDefense.current.gameState === "itemChoice"`, "装備比較から選択肢へ戻る操作");
    await evaluate(client, `(() => {
      const item = globalThis.MakaiDefense.current.itemOffer.choices.find((entry) => entry.type === "sand");
      document.querySelector('[data-item-choice="' + item.uid + '"]').click();
      document.getElementById("confirmReplaceBtn").click();
    })()`);
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "playing" && globalThis.MakaiDefense.current.equipment.sand.uid !== ${JSON.stringify(previousSandUid)}`, "同種装備の入れ替え");
    await evaluate(client, `globalThis.MakaiDefense.current.applyDebuff("rottenRations")`);
    await waitFor(client, `!!document.querySelector('[data-debuff-id="rottenRations"]')`, "デバフの装備欄同居表示");

    await evaluate(client, `(() => {
      const game = globalThis.MakaiDefense.current;
      const rolls = [0, 0.7, 0, 0, 0, 0, 0];
      game.setRandom(() => rolls.length ? rolls.shift() : 0);
      game.nutrients = 999;
      game.wave = 6;
      game.gameState = "playing";
      game.heroes.length = 0;
      game.spawnQueue.length = 0;
      game.settleWave();
    })()`);
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "dialogue" && globalThis.MakaiDefense.current.dialogue?.id === "shop" && !document.getElementById("dialogueOverlay").classList.contains("hidden")`, "ショップ前会話表示");
    const shopDialogue = await evaluate(client, `(() => {
      const overlay = document.getElementById("dialogueOverlay");
      const box = document.getElementById("dialogueAdvanceBtn");
      const overlayRect = overlay.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      return {
        state: globalThis.MakaiDefense.current.gameState,
        speaker: document.getElementById("dialogueSpeaker").textContent,
        hiddenShop: document.getElementById("itemShopOverlay").classList.contains("hidden"),
        label: document.getElementById("waveLabel").textContent,
        timer: document.getElementById("waveTimer").textContent,
        eventLayout: overlay.classList.contains("dialogue-event"),
        centerDelta: Math.round(Math.abs((boxRect.top + boxRect.bottom) / 2 - (overlayRect.top + overlayRect.bottom) / 2)),
      };
    })()`);
    if (shopDialogue.state !== "dialogue" || shopDialogue.speaker !== "コンビニ店員のスライム" || !shopDialogue.hiddenShop || shopDialogue.label !== "会話中" || shopDialogue.timer !== "時間停止中" || !shopDialogue.eventLayout || shopDialogue.centerDelta > 2) {
      throw new Error(`ショップ前会話が不正です: ${JSON.stringify(shopDialogue)}`);
    }
    await advanceDialogueTo(client, "shop", "ショップ前会話後のショップ状態");
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "shop" && !document.getElementById("itemShopOverlay").classList.contains("hidden") && document.querySelectorAll("[data-shop-item]").length === 5`, "ショップ表示");
    const shop = await evaluate(client, `({
      state: globalThis.MakaiDefense.current.gameState,
      goods: globalThis.MakaiDefense.current.shopOffer?.goods || [],
      cards: document.querySelectorAll("[data-shop-item]").length,
      label: document.getElementById("waveLabel").textContent,
      timer: document.getElementById("waveTimer").textContent,
      priceText: document.querySelector("[data-shop-item] .shop-price")?.textContent || "",
      closeHeight: Math.round(document.getElementById("closeShopBtn").getBoundingClientRect().height),
      closeText: document.getElementById("closeShopBtn").textContent.trim()
    })`);
    if (shop.state !== "shop" || shop.cards !== 5 || shop.goods.map((good) => good.item.type).join(",") !== "sand,water,fungus,mineral,air" || shop.goods.some((good) => !good.item.uid || good.sold) || shop.label !== "ショップ" || shop.timer !== "時間停止中" || !shop.priceText.includes("栄養") || shop.closeHeight < 44 || shop.closeText !== "← 防衛へ戻る") {
      throw new Error(`ショップ表示が不正です: ${JSON.stringify(shop)}`);
    }
    await evaluate(client, `(() => {
      const good = globalThis.MakaiDefense.current.shopOffer.goods.find((entry) => entry.item.type === "water");
      document.querySelector('[data-shop-item="' + good.item.uid + '"]').click();
    })()`);
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "shop" && !!globalThis.MakaiDefense.current.equipment.water && globalThis.MakaiDefense.current.shopOffer.goods.find((entry) => entry.item.type === "water").sold`, "商店の1個目購入");
    await evaluate(client, `(() => {
      const good = globalThis.MakaiDefense.current.shopOffer.goods.find((entry) => entry.item.type === "fungus");
      document.querySelector('[data-shop-item="' + good.item.uid + '"]').click();
    })()`);
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "shop" && !!globalThis.MakaiDefense.current.equipment.fungus && Object.values(globalThis.MakaiDefense.current.equipment).filter(Boolean).length === 3`, "商店の複数購入");
    await evaluate(client, `document.getElementById("closeShopBtn").click()`);
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "playing" && document.getElementById("itemShopOverlay").classList.contains("hidden")`, "ショップ閉店後の再開");
    await evaluate(client, `(() => {
      const game = globalThis.MakaiDefense.current;
      game.setRandom(() => 0.99);
      game.wave = 7;
      game.gameState = "playing";
      game.heroes.length = 0;
      game.spawnQueue.length = 0;
      game.settleWave();
    })()`);
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "playing" && globalThis.MakaiDefense.current.postWaveEvent === null`, "撃退後イベントなし");
    const popupResult = await evaluate(client, `new Promise((resolve) => {
      const button = document.querySelector('[data-equipment-type="sand"]');
      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      button.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 7, clientX: x, clientY: y, pointerType: "touch" }));
      setTimeout(() => {
        button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 7, clientX: x, clientY: y, pointerType: "touch" }));
        const popup = document.getElementById("itemPopup");
        resolve({
          hidden: popup.classList.contains("hidden"),
          text: popup.textContent,
          selection: String(getSelection()),
        });
      }, 650);
    })`);
    if (popupResult.hidden || !popupResult.text.includes("砂") || !popupResult.text.includes("土壌") || popupResult.selection) {
      throw new Error(`装備長押しポップアップが不正です: ${JSON.stringify(popupResult)}`);
    }

    await evaluate(client, `document.getElementById("quitRunBtn").click(); document.getElementById("confirmQuitBtn").click()`);
    await waitFor(client, `globalThis.MakaiDefense.current.gameState === "title" && !document.getElementById("startOverlay").classList.contains("hidden") && !document.querySelector(".home-tabs").classList.contains("hidden")`, "終了確定後の初期画面");
    const interruptedProgress = await readStoredProgress(client);
    if (interruptedProgress?.activeRun !== null || Object.prototype.hasOwnProperty.call(interruptedProgress || {}, "discoveredItems") || Object.prototype.hasOwnProperty.call(interruptedProgress || {}, "unlockedItems")) {
      throw new Error(`終了確定後の保存状態が不正です: ${JSON.stringify(interruptedProgress)}`);
    }
    const removedCodex = await evaluate(client, `({
      homeTabs: [...document.querySelectorAll("[data-home-tab]")].map((button) => button.textContent.trim()),
      codexTab: !!document.querySelector('[data-home-tab="codex"]'),
      codexGrid: !!document.getElementById("codexGrid"),
      resetLabel: (() => {
        document.querySelector('[data-home-tab="settings"]').click();
        document.querySelector('[data-settings-tab="dev"]').click();
        return document.getElementById("resetProgressBtn")?.textContent.trim() || "";
      })(),
    })`);
    if (removedCodex.homeTabs.join("/") !== "防衛/モンスターデッキ/設定" || removedCodex.codexTab || removedCodex.codexGrid || removedCodex.resetLabel !== "進行状況を初期化") {
      throw new Error(`独立図鑑の削除状態が不正です: ${JSON.stringify(removedCodex)}`);
    }

    const issues = collectIssues(client.events);
    if (issues.length) throw new Error(`ブラウザ実行エラー:\n${issues.join("\n")}`);

    console.log("OK: 初回素材の開始保留・失敗表示・再読み込み復旧、3択ホーム画面、20系統デッキ詳細、3画面幅、設定、中央イベント会話、canvas描画、ステータス、終了確認、装備3択・交換・商店・長押しを検査しました");
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
