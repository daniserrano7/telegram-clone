const CACHE_NAME = 'telegram-clone-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'New Message',
    body: 'You have a new message',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'new-message',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open Chat'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();

      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || `message-${data.chatId || 'unknown'}-${Date.now()}`,
        vibrate: data.vibrate || notificationData.vibrate,
        silent: data.silent !== undefined ? data.silent : notificationData.silent,
        requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : notificationData.requireInteraction,
        timestamp: data.timestamp || Date.now(),
        data: data.data || data
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  const isChrome = navigator.userAgent.toLowerCase().includes('chrome');

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    data: notificationData.data,
    dir: notificationData.dir || 'auto',
    lang: notificationData.lang || 'en',
  };

  if (notificationData.image) {
    notificationOptions.image = notificationData.image;
  }

  if (notificationData.vibrate) {
    notificationOptions.vibrate = notificationData.vibrate;
  }

  if (isFirefox) {
    notificationOptions.tag = notificationData.tag;
  } else if (isChrome) {
    notificationOptions.tag = `chrome-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    notificationOptions.badge = notificationData.badge;
    notificationOptions.actions = notificationData.actions;
    notificationOptions.requireInteraction = notificationData.requireInteraction || false;
    notificationOptions.silent = notificationData.silent || false;
    notificationOptions.renotify = true;
    notificationOptions.timestamp = notificationData.timestamp || Date.now();
  } else {
    notificationOptions.tag = notificationData.tag;
    notificationOptions.badge = notificationData.badge;
    notificationOptions.actions = notificationData.actions;
    notificationOptions.requireInteraction = notificationData.requireInteraction || false;
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationOptions
  ).catch(error => {
    console.error('Error showing notification:', error);
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.chatId
    ? `/chats/${event.notification.data.chatId}`
    : '/chats';

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url.includes('/chats')) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      if (event.notification.data?.chatId) {
        matchingClient.navigate(urlToOpen);
      }
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-message-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // TODO: Implement offline message queue processing
}