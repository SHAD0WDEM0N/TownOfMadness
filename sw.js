/* Town of Madness local-only archive bridge.
 * The browser reads its own IndexedDB game ZIP, never fetching user files from a server.
 * Only the two exact virtual archive names are intercepted.
 */
const DB = "townofmadness-v1";
const STORE = "games";
const ARCHIVES = {
  "townofmadness-mm1.zip": "mm1",
  "townofmadness-mm2.zip": "mm2"
};

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

function getRecord(key) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onerror = () => reject(open.error);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE)) open.result.createObjectStore(STORE, {keyPath: "id"});
    };
    open.onsuccess = () => {
      const db = open.result;
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      request.onsuccess = () => {resolve(request.result); db.close();};
      request.onerror = () => {reject(request.error); db.close();};
    };
  });
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const basename = url.pathname.split("/").pop();
  const key = ARCHIVES[basename];
  if (!key || !["GET", "HEAD"].includes(event.request.method)) return;
  event.respondWith((async () => {
    try {
      const record = await getRecord(key);
      if (!record?.blob) return new Response("Game ZIP not installed", {status: 404});
      const headers = new Headers({
        "Content-Type": "application/zip",
        "Content-Length": String(record.blob.size),
        "Cache-Control": "no-store",
        "X-TownOfMadness-Source": "browser-local"
      });
      return new Response(event.request.method === "HEAD" ? null : record.blob, {status: 200, headers});
    } catch {
      return new Response("Local ZIP storage error", {status: 503});
    }
  })());
});
