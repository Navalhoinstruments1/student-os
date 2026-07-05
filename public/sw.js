self.addEventListener('install', () => {
  console.log('[Student OS] Motor PWA instalado com sucesso.');
  self.skipWaiting(); // Força a ativação imediata
});

self.addEventListener('activate', () => {
  console.log('[Student OS] Motor PWA ativo e a controlar a App.');
  return self.clients.claim();
});

// O intercetor básico (obrigatório para a app ser instalável)
self.addEventListener('fetch', () => {
  // Por agora deixa a internet fluir normalmente. 
  // Na Fase 2 (Notificações) e Offline, vamos dar-lhe superpoderes aqui.
});