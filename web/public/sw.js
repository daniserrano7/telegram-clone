// Service Worker for Push Notifications
const CACHE_NAME = 'telegram-clone-v1';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
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

// Push event - handle incoming push notifications
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

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        tag: data.tag || `message-${data.chatId || Date.now()}`,
        data: data // Store additional data for click handling
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  // Firefox-compatible notification options
  const firefoxOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    tag: notificationData.tag,
    data: notificationData.data
  };

  // Add badge and actions only if supported (Chrome-specific features)
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  if (!isFirefox) {
    firefoxOptions.badge = notificationData.badge;
    firefoxOptions.actions = notificationData.actions;
    firefoxOptions.requireInteraction = notificationData.requireInteraction;
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    firefoxOptions
  );

  event.waitUntil(promiseChain);
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Handle notification click - open or focus the app
  const urlToOpen = event.notification.data?.chatId 
    ? `/chats/${event.notification.data.chatId}`
    : '/chats';

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;

    // Check if there's already a window/tab open with our app
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url.includes('/chats')) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      // Focus existing window and navigate if needed
      if (event.notification.data?.chatId) {
        matchingClient.navigate(urlToOpen);
      }
      return matchingClient.focus();
    } else {
      // Open new window
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

// Background sync for offline message sending (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'background-message-sync') {
    // Handle offline message queue sync
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Future: Implement offline message queue processing
  console.log('Background sync processing...');
}