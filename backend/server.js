// backend/server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Import HTTP
const { Server } = require("socket.io"); // 2. Import Socket.io

require('dotenv').config(); 

const locationRoutes = require('./routes/location.routes');
const authRoutes = require('./routes/auth.routes');
const favoriteRoutes = require('./routes/favorite.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// 3. Tạo HTTP Server bọc lấy app
const server = http.createServer(app);

// Cấu hình Socket.io
const io = new Server(server, {
  cors: {
    // 👇 SỬA LẠI: Cho phép tất cả (*) hoặc điền đúng domain frontend của bạn
    // Nếu bạn đang test Frontend ở localhost, server deploy ở mạng, thì cứ để "*" cho tiện
    origin: "*", 
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Lưu biến io vào app để dùng được ở Controller
app.set("socketio", io);

// Lắng nghe kết nối Socket
io.on("connection", (socket) => {
  console.log("⚡ Client Connected:", socket.id);

  // Admin sẽ join vào phòng riêng tên là 'admin_room'
  socket.on("join_admin_room", () => {
    socket.join("admin_room");
    console.log(`User ${socket.id} đã vào phòng Admin`);
  });

  socket.on("disconnect", () => {
    console.log("Client Disconnected:", socket.id);
  });
});

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => { res.send('🚀 Server FoodMap Running!'); });
app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);
require('./routes/review.routes')(app);
try { require('./routes/menu.routes')(app); } catch (e) {}

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ success: false, message: "Lỗi server!", error: err.message });
});

// 5. QUAN TRỌNG: Đổi app.listen thành server.listen
server.listen(PORT, () => {
  console.log(`🚀 Server & Socket chạy tại: http://localhost:${PORT}`);
});