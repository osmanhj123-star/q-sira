const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname)));

io.on('connection', (socket) => {
    console.log('مستخدم جديد متصل:', socket.id);

    socket.on('order_ready', (orderNumber) => {
        console.log(`طلب رقم ${orderNumber} أصبح جاهزاً!`);
        io.emit('notify_customer', orderNumber);
    });

    socket.on('disconnect', () => {
        console.log('قطع الاتصال:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Q-Sıra سيرفر يعمل بنجاح على الرابط http://localhost:${PORT}`);
});