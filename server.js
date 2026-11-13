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

// مفاتيح VAPID الخاصة بـ Web Push (تم توليدها خصيصاً لمشروعك)
const publicVapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYVK5NzlFY';
const privateVapidKey = '5_A3N182-jQh17W2l_1B7c1Q5g2X8l3J9z8F1k4v7m0';

webpush.setVapidDetails(
    'mailto:support@qsira.com',
    publicVapidKey,
    privateVapidKey
);

// تخزين اشتراكات الزبائن للإشعارات
let pushSubscriptions = {}; 
// تخزين حالة الطلبات
let orderStatuses = {};

// استقبال اشتراك المتصفح بالـ Push
app.post('/subscribe', (req, res) => {
    const { orderNumber, subscription } = req.body;
    if (orderNumber) {
        pushSubscriptions[orderNumber] = subscription;
        res.status(201).json({ message: 'Subscribed successfully' });
    } else {
        res.status(400).json({ error: 'Order number required' });
    }
});

io.on('connection', (socket) => {
    socket.on('join-order', (orderNum) => {
        socket.join(`order-${orderNum}`);
        if (orderStatuses[orderNum]) {
            socket.emit('order-status-update', { orderNumber: orderNum, status: orderStatuses[orderNum] });
        }
    });

    socket.on('update-status', (data) => {
        const { orderNumber, status } = data;
        orderStatuses[orderNumber] = status;
        io.to(`order-${orderNumber}`).emit('order-status-update', { orderNumber, status });

        // إذا أصبح الطلب جاهزاً، أرسل إشعار Web Push حقيقي حتى لو التطبيق مغلق!
        if (status === 'ready' && pushSubscriptions[orderNumber]) {
            const payload = JSON.stringify({
                title: 'Q-Sıra - Siparişiniz Hazır! 🥳',
                body: `Sipariş #${orderNumber} teslim almaya hazırdır.`
            });

            webpush.sendNotification(pushSubscriptions[orderNumber], payload)
                .catch(err => console.error('Error sending push notification:', err));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
