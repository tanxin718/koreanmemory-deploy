/**
 * KoreanMemory - Service Worker
 * 缓存静态资源，实现离线可用
 */
const CACHE_NAME = 'korean-memory-v18';
const STATIC_CACHE = 'korean-memory-static-v18';
const DATA_CACHE = 'korean-memory-data-v18';

// 需要预缓存的静态资源
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sql-wasm.js',
  './sql-wasm.wasm',
  './css/main.css',
  './css/components.css',
  './css/dark.css',
  './js/db.js',
  './js/sm2.js',
  './js/points.js',
  './js/tts.js',
  './js/quotes.js',
  './js/pwa.js',
  './js/app.js',
  './js/pages/home.js',
  './js/pages/wordList.js',
  './js/pages/wordDetail.js',
  './js/pages/study.js',
  './js/pages/review.js',
  './js/pages/search.js',
  './js/pages/favorites.js',
  './js/pages/settings.js',
  './js/pages/stats.js',
  './js/pages/topics.js',
  './js/pages/quiz.js',
  './js/pages/points.js',
  './js/components/wordCard.js',
  './js/components/conjugationList.js',
  './js/components/hanjaTree.js',
  './js/components/searchBar.js',
  './icons/illustration-home.jpg',
  './icons/illustration-empty-study.jpg',
  './icons/illustration-empty-review.jpg',
  './icons/illustration-celebrate.jpg',
  './icons/mascot-character.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './data/korean.db',
  './lib/all.min.css',
  './lib/webfonts/fa-solid-900.woff2',
  './lib/webfonts/fa-regular-400.woff2',
  './lib/webfonts/fa-brands-400.woff2'
];

// 安装：预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] 预缓存静态资源');
        // 逐个缓存，忽略失败的文件
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err => {
              console.warn(`[SW] 缓存失败: ${url}`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => {
          return key !== STATIC_CACHE && key !== DATA_CACHE;
        }).map(key => {
          console.log('[SW] 删除旧缓存:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截：缓存优先策略
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 跳过非 GET 请求
  if (event.request.method !== 'GET') return;

  // 跳过 chrome-extension 等非 HTTP 请求
  if (!url.protocol.startsWith('http')) return;

  // CDN 资源：缓存优先
  if (url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // 静态资源：缓存优先
  if (url.pathname.match(/\.(css|js|png|jpg|svg|ico|woff2?)$/)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // 数据库文件：缓存优先
  if (url.pathname.endsWith('.db')) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // 其他请求：网络优先，失败时回退缓存
  event.respondWith(networkFirst(event.request));
});

/**
 * 缓存优先策略
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // 离线且无缓存
    if (request.destination === 'document') {
      return caches.match('./index.html');
    }
    throw e;
  }
}

/**
 * 网络优先策略
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw e;
  }
}

// 推送通知（预留）
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '该复习单词了！',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'review-reminder',
    data: { url: './#review' }
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'KoreanMemory',
      options
    )
  );
});

// 点击通知
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
        clients[0].navigate(event.notification.data.url || './');
      } else {
        clients.openWindow('./');
      }
    })
  );
});