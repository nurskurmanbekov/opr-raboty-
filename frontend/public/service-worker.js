const CACHE_NAME = 'probation-monitor-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );

  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response for future use
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);

          // Return offline page if available
          return caches.match('/offline.html');
        });
      })
  );
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-work-sessions') {
    event.waitUntil(syncWorkSessions());
  }

  if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos());
  }

  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocation());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  const options = {
    body: 'Default notification body',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'notification',
    requireInteraction: false
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'Probation Monitor';
    options.data = data.data || {};
    options.tag = data.type || options.tag;
  }

  event.waitUntil(
    self.registration.showNotification(options.title || 'Probation Monitor', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Helper functions for background sync
async function syncWorkSessions() {
  try {
    // Get pending work sessions from IndexedDB
    const db = await openDatabase();
    const pendingSessions = await getPendingWorkSessions(db);

    if (pendingSessions.length === 0) {
      console.log('[Service Worker] No pending work sessions to sync');
      return;
    }

    console.log(`[Service Worker] Syncing ${pendingSessions.length} work sessions`);

    // Send to server via sync API
    const response = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        operations: pendingSessions.map(session => ({
          operation: 'create_work_session',
          resourceType: 'WorkSession',
          resourceId: session.id,
          data: session,
          timestamp: session.createdAt
        }))
      })
    });

    if (response.ok) {
      console.log('[Service Worker] Work sessions synced successfully');
      await clearSyncedWorkSessions(db, pendingSessions);
    } else {
      console.error('[Service Worker] Failed to sync work sessions');
    }

  } catch (error) {
    console.error('[Service Worker] Sync error:', error);
    throw error;
  }
}

async function syncPhotos() {
  try {
    const db = await openDatabase();
    const pendingPhotos = await getPendingPhotos(db);

    if (pendingPhotos.length === 0) {
      console.log('[Service Worker] No pending photos to sync');
      return;
    }

    console.log(`[Service Worker] Syncing ${pendingPhotos.length} photos`);

    // Upload photos one by one
    for (const photo of pendingPhotos) {
      const formData = new FormData();
      formData.append('photo', photo.file);
      formData.append('workSessionId', photo.workSessionId);
      formData.append('photoType', photo.photoType);

      const response = await fetch('/api/work-sessions/photos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: formData
      });

      if (response.ok) {
        await clearSyncedPhoto(db, photo.id);
      }
    }

    console.log('[Service Worker] Photos synced successfully');

  } catch (error) {
    console.error('[Service Worker] Photo sync error:', error);
    throw error;
  }
}

async function syncLocation() {
  try {
    const db = await openDatabase();
    const pendingLocations = await getPendingLocations(db);

    if (pendingLocations.length === 0) {
      console.log('[Service Worker] No pending locations to sync');
      return;
    }

    console.log(`[Service Worker] Syncing ${pendingLocations.length} locations`);

    const response = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        operations: pendingLocations.map(location => ({
          operation: 'update_location',
          resourceType: 'LocationHistory',
          data: location,
          timestamp: location.timestamp
        }))
      })
    });

    if (response.ok) {
      console.log('[Service Worker] Locations synced successfully');
      await clearSyncedLocations(db, pendingLocations);
    }

  } catch (error) {
    console.error('[Service Worker] Location sync error:', error);
    throw error;
  }
}

// IndexedDB helper functions (simplified)
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ProbationMonitor', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getPendingWorkSessions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['workSessions'], 'readonly');
    const store = transaction.objectStore('workSessions');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function getPendingPhotos(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function getPendingLocations(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['locations'], 'readonly');
    const store = transaction.objectStore('locations');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function clearSyncedWorkSessions(db, sessions) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['workSessions'], 'readwrite');
    const store = transaction.objectStore('workSessions');

    sessions.forEach(session => {
      store.delete(session.id);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function clearSyncedPhoto(db, photoId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');
    const request = store.delete(photoId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function clearSyncedLocations(db, locations) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['locations'], 'readwrite');
    const store = transaction.objectStore('locations');

    locations.forEach(location => {
      store.delete(location.id);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getAuthToken() {
  // Get token from IndexedDB or localStorage
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['auth'], 'readonly');
    const store = transaction.objectStore('auth');
    const request = store.get('token');

    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value || '');
    });
  } catch (error) {
    console.error('[Service Worker] Error getting auth token:', error);
    return '';
  }
}

console.log('[Service Worker] Loaded');
