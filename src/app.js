import {inspectZip} from "./zip.js";

const catalog = {
  mm1: {name: "Midtown Madness", executables: ["midtown.exe", "Open1560.exe"], required: ["audio.ar", "core.ar", "ui.ar"], archive: "townofmadness-mm1"},
  mm2: {name: "Midtown Madness 2", executables: ["midtown2.exe"], required: [], archive: "townofmadness-mm2"}
};
const dbName = "townofmadness-v1";
const storeName = "games";
const $ = (id) => document.getElementById(id);
let selected = "mm1";
let engineReady = false;
const wineRoot = "TinyCore15Wine11.0-web";
let runtimeVersion = "";
let bridgeReady = false;
let activeSession = false;
const records = {};

function log(message) {
  const line = new Date().toLocaleTimeString() + "  " + message;
  const pre = $("activityLog");
  pre.textContent = (pre.textContent === "Waiting for setup…" ? "" : pre.textContent + "\n") + line;
  pre.scrollTop = pre.scrollHeight;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Browser storage error."));
  });
}

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, {keyPath: "id"});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local storage."));
  });
}

async function readRecord(id) {
  const db = await openDatabase();
  try {
    return await requestToPromise(db.transaction(storeName, "readonly").objectStore(storeName).get(id));
  } finally {
    db.close();
  }
}

async function writeRecord(record) {
  const db = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).put(record);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Game archive could not be saved."));
      transaction.onabort = () => reject(transaction.error || new Error("Browser storage quota exceeded."));
    });
  } finally {
    db.close();
  }
}

function setIndicator(id, ok, unknown = false) {
  const element = $(id);
  element.classList.toggle("ok", ok);
  element.classList.toggle("bad", !ok && !unknown);
  element.textContent = unknown ? "…" : ok ? "✓" : "×";
}

function render() {
  const game = catalog[selected];
  const record = records[selected];
  $("setup-title").textContent = game.name;
  $("placeholderTitle").textContent = game.name;
  $("placeholderDescription").textContent = record ? (record.exeName?.toLowerCase() === "open1560.exe"
    ? "Open1560 archive ready. Browser runtime compatibility is experimental and unverified."
    : "Original Windows game archive ready. The runtime must also be installed.") :
    "Import the installed PC game folder as a ZIP to begin.";
  $("archiveStatus").textContent = record ?
    record.fileName + " · " + record.exeName + " · " + record.fileCount + " files · " + (record.archiveSize / 1048576).toFixed(1) + " MB" :
    "No game archive imported. Expected " + game.executables.join(" or ") + ".";
  setIndicator("archiveIndicator", Boolean(record));
  $("launchButton").disabled = !(engineReady && bridgeReady && record && !activeSession);
  $("launchButton").textContent = "▶ Launch " + (selected === "mm1" ? "Midtown Madness" : "Midtown Madness 2");
  $("importButton").disabled = activeSession;
  $("notepadButton").disabled = !engineReady || activeSession;
  document.querySelectorAll("[data-game]").forEach((button) => {
    const active = button.dataset.game === selected;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.disabled = activeSession;
  });
}

async function inspectRuntime() {
  let message = "BoxedWine WebAssembly bundle is not deployed yet.";
  try {
    const [html, wasm, script, manifestResponse] = await Promise.all([
      fetch("./engine/boxedwine.html", {method: "HEAD", cache: "no-store"}),
      fetch("./engine/boxedwine.wasm", {method: "HEAD", cache: "no-store"}),
      fetch("./engine/boxedwine.js", {method: "HEAD", cache: "no-store"}),
      fetch("./engine/runtime-manifest.json", {cache: "no-store"})
    ]);
    const built = html.ok && wasm.ok && script.ok;
    const manifest = manifestResponse.ok ? await manifestResponse.json() : null;
    runtimeVersion = manifest?.filesystem_version || "";
    if (built && manifest?.ready && manifest.root === wineRoot + ".zip") {
      const filesystem = await fetch("./engine/" + manifest.root, {method: "HEAD", cache: "no-store"});
      engineReady = filesystem.ok;
      message = filesystem.ok ?
        "BoxedWine WASM + Wine 11 filesystem v" + runtimeVersion + " detected. Ready for Windows boot testing." :
        "WASM detected, but its Wine filesystem ZIP cannot be reached.";
    } else if (built) {
      engineReady = false;
      message = "WASM detected, but no verified Wine filesystem has been deployed.";
    } else {
      engineReady = false;
    }
  } catch (error) {
    engineReady = false;
    message = "Runtime check failed: " + error.message;
  }
  $("engineStatus").textContent = message;
  setIndicator("engineIndicator", engineReady);
  $("runtimePill").classList.toggle("ready", engineReady);
  $("runtimePill").classList.toggle("missing", !engineReady);
  $("runtimePill").lastChild.textContent = engineReady ? "Boot test available" : "Engine setup needed";
  log(message);
  render();
}

async function initializeBridge() {
  if (!("serviceWorker" in navigator) || !("indexedDB" in window) || !window.isSecureContext) {
    $("bridgeStatus").textContent = "Requires HTTPS/localhost, Service Workers and IndexedDB.";
    setIndicator("bridgeIndicator", false);
    log("Local archive bridge unavailable in this browser/context.");
    return;
  }
  try {
    await navigator.serviceWorker.register("./sw.js", {scope: "./"});
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Service worker not controlling this page yet. Refresh.")), 6000);
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          clearTimeout(timeout);
          resolve();
        }, {once: true});
      });
    }
    await openDatabase().then((db) => db.close());
    bridgeReady = true;
    $("bridgeStatus").textContent = "Ready. Game ZIPs are served privately from this browser.";
    setIndicator("bridgeIndicator", true);
    log("Local browser ZIP handoff ready.");
  } catch (error) {
    $("bridgeStatus").textContent = "Unavailable: " + error.message;
    setIndicator("bridgeIndicator", false);
    log("Bridge error: " + error.message);
  }
  render();
}

async function restore() {
  for (const key of Object.keys(catalog)) {
    try {
      records[key] = await readRecord(key);
    } catch (error) {
      log("Cannot restore stored game: " + error.message);
    }
  }
  render();
}

async function importGame(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".zip")) {
    log("Import rejected: Select a ZIP of the installed game folder, not an ISO or setup executable.");
    alert("Select a .zip of the installed Midtown Madness game folder. ISO/installer import is not supported yet.");
    return;
  }
  const gameKey = selected;
  const game = catalog[gameKey];
  $("importButton").disabled = true;
  $("importButton").textContent = "Inspecting ZIP…";
  try {
    const details = await inspectZip(file, game.executables, game.required);
    log("Validated " + file.name + ": " + details.fileCount + " entries, executable " + details.exePath + ".");
    $("importButton").textContent = "Saving locally…";
    const record = {
      id: gameKey,
      blob: file,
      fileName: file.name,
      exePath: details.exePath,
      exeName: details.exeName,
      fileCount: details.fileCount,
      archiveSize: details.archiveSize,
      updatedAt: Date.now()
    };
    await writeRecord(record);
    records[gameKey] = record;
    log("Imported game privately to browser storage. No upload performed.");
  } catch (error) {
    log("Import failed: " + error.message);
    alert(error.message);
  } finally {
    $("fileInput").value = "";
    $("importButton").textContent = "↥ Import / replace game ZIP";
    render();
  }
}

async function startGame() {
  const game = catalog[selected];
  const record = records[selected];
  if (!engineReady || !bridgeReady || !record || activeSession) return;
  const zipUrl = new URL("./" + game.archive + ".zip", location.href);
  try {
    const check = await fetch(zipUrl, {method: "HEAD", cache: "no-store"});
    if (!check.ok) throw new Error("Local ZIP bridge returned " + check.status + ".");
  } catch (error) {
    log("Launch blocked: " + error.message);
    alert("The browser could not serve your local ZIP to BoxedWine. " + error.message);
    return;
  }
  // BoxedWine mounts the app ZIP at c:/files (see upstream buildFlags.txt).
  const fullExe = "c:/files/" + record.exePath;
  const lastSlash = fullExe.lastIndexOf("/");
  const workDir = fullExe.slice(0, lastSlash);
  const params = new URLSearchParams({
    root: wineRoot,
    app: game.archive,
    p: fullExe,
    w: workDir,
    resolution: "800x600"
  });
  const launcher = new URL("./engine/boxedwine.html", location.href);
  launcher.search = params.toString();
  $("gameFrame").src = launcher.toString();
  $("gameFrame").hidden = false;
  $("placeholder").hidden = true;
  $("placeholder").style.display = "none";
  $("viewportStatus").textContent = "EMULATOR START REQUESTED";
  $("stopButton").hidden = false;
  $("fullscreenButton").disabled = false;
  activeSession = true;
  log("Requested BoxedWine launch for " + record.exeName + ". Open1560 uses Windows x86 + SDL3/OpenGL; browser compatibility remains unverified.");
  render();
}

function startNotepad() {
  if (!engineReady || activeSession) return;
  const launcher = new URL("./engine/boxedwine.html", location.href);
  launcher.search = new URLSearchParams({
    root: wineRoot,
    p: "notepad",
    resolution: "800x600",
    "wine-override": "nomono"
  }).toString();
  $("gameFrame").src = launcher.toString();
  $("gameFrame").hidden = false;
  $("placeholder").hidden = true;
  $("placeholder").style.display = "none";
  $("viewportStatus").textContent = "WINE NOTEPAD BOOT REQUESTED";
  $("stopButton").hidden = false;
  $("fullscreenButton").disabled = false;
  activeSession = true;
  log("Requested Wine Notepad boot with filesystem v" + runtimeVersion + ". Success must be confirmed on screen.");
  render();
}

function stopGame() {
  $("gameFrame").src = "about:blank";
  $("gameFrame").hidden = true;
  $("placeholder").hidden = false;
  $("placeholder").style.display = "";
  $("viewportStatus").textContent = "STANDBY";
  $("stopButton").hidden = true;
  $("fullscreenButton").disabled = true;
  activeSession = false;
  log("Emulator frame closed.");
  render();
}

function setupEvents() {
  document.querySelectorAll("[data-game]").forEach((button) => {
    button.addEventListener("click", () => {
      if (activeSession) return;
      selected = button.dataset.game;
      render();
    });
  });
  $("importButton").addEventListener("click", () => $("fileInput").click());
  $("fileInput").addEventListener("change", (event) => importGame(event.target.files[0]));
  $("launchButton").addEventListener("click", startGame);
  $("notepadButton").addEventListener("click", startNotepad);
  $("stopButton").addEventListener("click", stopGame);
  $("fullscreenButton").addEventListener("click", () => {
    const element = $("gameFrame");
    if (element.requestFullscreen) element.requestFullscreen().catch((error) => log(error.message));
  });
}

setupEvents();
render();
Promise.allSettled([inspectRuntime(), initializeBridge(), restore()]).then(() => {
  log("Phase A2.2: runtime and root filesystem checks completed. Windows boot and gameplay remain unverified.");
});
