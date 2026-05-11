// public/sw.js

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      //icon: data.icon || '/icon-192x192.png', // Asegurate de tener un logo del seguro acá
      //badge: data.badge || '/icon-192x192.png', // Un logo chiquito transparente
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Cuando tocan la notificación, los lleva a la URL
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});