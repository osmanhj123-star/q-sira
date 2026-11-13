self.addEventListener('push', function(event) {
    const data = event.data ? event.data.text() : 'Siparişiniz hazır!';
    event.waitUntil(
        self.registration.showNotification('Q-Sıra - Bildirim', {
            body: data,
            vibrate: [300, 100, 300]
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});