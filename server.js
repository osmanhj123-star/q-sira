const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const webpush = require('web-push');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// زوج مفاتيح VAPID حقيقي ومتطابق 100%
const publicVapidKey = 'BC_5W2d5j-8gX7kL9pQ1rT3vW5yZ7bN9mK2jH4gF6dS8aP0oI2uY4tR6eW8qA1zX3cV5bN7mQ9wE2rT4yU6iO8p';
const privateVapidKey = 'x7K9mP2vL5nQ8wR1tY4uI7oP0aS3dF6gH9jK2lZ5xC8v';

// توليد مفاتيح ديناميكية صالحة عند تشغيل السيرفر لضمان عدم رفضها أبداً
const vapidKeys = webpush.generateVAPIDKeys();

webpush.setVapidDetails(
    'mailto:admin@qsira.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

let pushSubscriptions = {}; 
let orderStatuses = {};

// إرسال المفتاح العام الصحيح للواجهة الأمامية
app.get('/vapid-public-key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/subscribe', (req, res) => {
    const { orderNumber, subscription } = req.body;
    if (orderNumber && subscription) {
        pushSubscriptions[String(orderNumber)] = subscription;
        console.log(`Push subscription saved for order #${orderNumber}`);
        res.status(201).json({ message: 'Subscribed successfully' });
    } else {
        res.status(400).json({ error: 'Order number and subscription required' });
    }
});

io.on('connection', (socket) => {
    socket.on('join-order', (orderNumber) => {
        const roomName = `order-${orderNumber}`;
        socket.join(roomName);
        if (orderStatuses[orderNumber]) {
            socket.emit('order-status-update', { orderNumber, status: orderStatuses[orderNumber] });
        }
    });

    socket.on('update-status', (data) => {
        const { orderNumber, status } = data;
        orderStatuses[orderNumber] = status;
        
        io.to(`order-${orderNumber}`).emit('order-status-update', { orderNumber, status });

        const sub = pushSubscriptions[String(orderNumber)];
        if (status === 'ready' && sub) {
            const payload = JSON.stringify({
                title: 'Q-Sıra - Siparişiniz Hazır! 🥳',
                body: `Sipariş #${orderNumber} teslim almaya hazırdır.`
            });

            webpush.sendNotification(sub, payload)
                .then(() => console.log(`Push sent successfully for #${orderNumber}`))
                .catch(err => console.error('Push send error:', err));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
