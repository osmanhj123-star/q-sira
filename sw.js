self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : { title: 'Q-Sıra', body: 'Güncelleme var' };
    
    const options = {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
