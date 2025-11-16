const CACHE_NAME = 'checkpeso-v2';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/logo.png',
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => key !== CACHE_NAME && caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Network-first for navigations and app shell; cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Sempre rede da rede para navegações (garante HTML atualizado)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Não cachear chamadas ao Supabase (rest/functions) para evitar dados obsoletos
  try {
    const url = new URL(request.url);
    const host = url.hostname || '';
    const isSupabaseHost = host.endsWith('supabase.co') || host.endsWith('supabase.com');
    const isSupabasePath = url.pathname.includes('/rest/v1/') || url.pathname.includes('/functions/v1/');
    if (isSupabaseHost || isSupabasePath) {
      event.respondWith(fetch(request));
      return;
    }
  } catch {}

  // Estático: cache-first com fallback à rede e atualização do cache
  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      }).catch(() => cached)
    )
  );
});