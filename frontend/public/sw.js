self.addEventListener('push', (event) => {
  let data = { title: 'TaskFlow', body: 'You have a new notification' };
  try {
    if (event.data) data = event.data.json();
  } catch {
    /* use defaults */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
