// Volume Fix service worker.
//
// 1. Offline: every file of the app (pages, scripts, icons, the tone template
//    and the ffmpeg.wasm decoder) is cached on install, so the app works in a
//    venue with no internet once it has been opened online.
// 2. Cross-origin isolation: adds COOP/COEP to the responses it serves, so
//    multithreaded ffmpeg.wasm works even on a host that can't set headers
//    (replaces the third-party coi-serviceworker).
//
// Pages are fetched fresh when online (so a new version shows up) and from the
// cache when offline. Everything else in the app is served from the cache.
// Requests outside the app (e.g. the dev server's sample decks) pass straight
// through. Nothing is ever sent anywhere: this only reads from this site.

/* The build replaces these two placeholders. */
const VERSION = "1.0.0-3b840e9708";
const PRECACHE = [
  "app.css",
  "app.js",
  "assets/reference_template.pptx",
  "calibrate.html",
  "calibrate.js",
  "guide.html",
  "icons/apple-touch-icon.png",
  "icons/bmc-qr.svg",
  "icons/icon-192.png",
  "icons/icon-32.png",
  "icons/icon-512.png",
  "icons/logo.svg",
  "icons/maskable-192.png",
  "icons/maskable-512.png",
  "index.html",
  "manifest.webmanifest",
  "vendor/ffmpeg-core-mt/ffmpeg-core.js",
  "vendor/ffmpeg-core-mt/ffmpeg-core.wasm.gz",
  "vendor/ffmpeg-core-mt/ffmpeg-core.worker.js",
  "vendor/ffmpeg-core/ffmpeg-core.js",
  "vendor/ffmpeg-core/ffmpeg-core.wasm.gz",
  "worker.js"
];

const CACHE = `volume-fix-${VERSION}`;
const scope = new URL(self.registration.scope);
const toUrl = (p) => new URL(p, scope).href;
const precached = new Set(PRECACHE.map(toUrl));

/** The cache key for a page request: "/", "/index.html", "/calibrate", "/calibrate.html" … */
function pageKey(url) {
  let p = url.pathname.slice(scope.pathname.length).replace(/\/$/, '');
  if (p === '') p = 'index.html';
  else if (!/\.[a-z0-9]+$/i.test(p)) p += '.html';
  return toUrl(p);
}

function isolate(res) {
  if (!res || res.type === 'opaque' || res.status === 0) return res;
  const h = new Headers(res.headers);
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Embedder-Policy', 'require-corp');
  h.set('Cross-Origin-Resource-Policy', 'same-origin');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const url of precached) {
      const res = await fetch(url, { cache: 'reload' });
      if (!res.ok) throw new Error(`precache failed for ${url}: HTTP ${res.status}`);
      // A host may redirect /index.html → /; store a plain (non-redirected) copy.
      await cache.put(url, res.redirected ? new Response(await res.blob(), { status: 200, headers: res.headers }) : res);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('volume-fix-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== scope.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return isolate(await fetch(req));
      } catch {
        const cached = await caches.match(pageKey(url), { ignoreSearch: true });
        return isolate(cached ?? Response.error());
      }
    })());
    return;
  }

  const key = new URL(url.pathname, scope.origin).href;
  if (!precached.has(key) || req.headers.has('range')) return; // not part of the app: leave it alone
  event.respondWith((async () => {
    const cached = await caches.match(key);
    if (cached) return isolate(cached);
    try { return isolate(await fetch(req)); } catch { return Response.error(); }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'version') event.source?.postMessage({ type: 'version', version: VERSION });
});
