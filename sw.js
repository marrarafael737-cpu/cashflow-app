/* sw.js - Service Worker for CashFlow */

const CACHE_NAME = 'cashflow-v24';
const ASSETS_TO_CACHE = [
  './',
  './dashboard.html',
  './login.html',
  './cadastro.html',
  './css/base.css',
  './css/animations.css',
  './css/components.css',
  './css/layout.css',
  './css/views.css',
  './css/mascot.css',
  './auth.js',
  './main.js',
  './js/config.js',
  './js/ui/utils.js',
  './js/ui/navigation.js',
  './js/ui/modals.js',
  './js/ui/dropdowns.js',
  './js/ui/transactions.js',
  './js/ui/accounts.js',
  './js/ui/credit-cards.js',
  './js/ui/goals.js',
  './js/ui/calendar.js',
  './js/ui/recurring.js',
  './js/ui/oracle.js',
  './js/ui/orchestrator.js',
  './js/finance.js',
  './js/account-reset.js',

  './js/transactions.js',
  './js/mascot.js',
  './js/events.js',
  './js/charts.js',
  './js/gamification.js',
  './js/search.js',
  './js/pwa-analytics.js',
  './js/offline-db.js',
  './js/sync-engine.js',
  './js/offline-sync.js',
  './js/smart-parser.js',
  './js/enhancements.js',
  './assets/mascot.svg'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('C.A.S.H. Unit: Caching Shell Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Network First strategy: always try network, fallback to cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições para o Supabase e APIs externas
  if (event.request.url.includes('supabase.co') || event.request.url.includes('cdnjs.cloudflare.com')) {
    return;
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Update the cache with the fresh response
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed, try cache (offline fallback)
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});
