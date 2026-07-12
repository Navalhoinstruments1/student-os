const CACHE_NAME = 'student-os-cache-v1';

// Ficheiros essenciais para guardar logo na instalação
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  // Se tiveres ícones essenciais, podes colocar aqui o caminho, ex: '/icons/icon-192x192.png'
];

self.addEventListener('install', (event) => {
  console.log('[Student OS] Motor PWA a instalar...');
  self.skipWaiting(); // Força a ativação imediata

  // Guarda os ficheiros core logo na instalação
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Student OS] Motor PWA ativo e a controlar a App!');
  event.waitUntil(self.clients.claim());

  // Limpa caches antigas se alguma vez mudares o CACHE_NAME para v2, v3, etc.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Student OS] A apagar cache antiga:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// O VERDADEIRO SUPERPODER OFFLINE
self.addEventListener('fetch', (event) => {
  // Ignorar pedidos que não sejam GET (como validações de formulários ou APIs complexas)
  // Ignorar também pedidos de extensões do Chrome
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 1. A net funcionou! Vamos fazer uma cópia de segurança silenciosa na Cache.
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response; // Devolve a página atualizada ao utilizador
      })
      .catch(() => {
        // 2. A NET FALHOU! (Offline Mode)
        // O Service Worker interceta o erro e vai buscar a cópia de segurança à Cache.
        console.log('[Student OS] Modo Offline ativado para:', event.request.url);
        return caches.match(event.request);
      })
  );
});