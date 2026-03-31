const CACHE = 'vistoria-v1';

const APP_SHELL = [
  '/app/index.html',
  '/app/home.html',
  '/app/vistoria.html',
  '/app/app.css',
  '/css/style.css',
  '/js/api.js',
  '/js/db.js',
];

// ── Instala: pré-carrega o shell do app ───────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── Ativa: limpa caches antigos ───────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: API = rede; App shell = cache first ────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Chamadas de API: rede (nunca cacheia)
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'Sem conexão com o servidor' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        })
      )
    );
    return;
  }

  // App shell e assets: cache first, atualiza em background
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => null);
      return cached || network;
    })
  );
});
