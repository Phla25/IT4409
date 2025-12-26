// backend/server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io");
require('dotenv').config(); 

// --- 1. IMPORT CÁC THƯ VIỆN BẢO MẬT ---
const helmet = require('helmet');
// ❌ BỎ DÒNG NÀY: const xss = require('xss-clean'); (Gây lỗi)
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const locationRoutes = require('./routes/location.routes');
const authRoutes = require('./routes/auth.routes');
const favoriteRoutes = require('./routes/favorite.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); 

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set("socketio", io);

io.on("connection", (socket) => {
  console.log("⚡ Client Connected:", socket.id);
  socket.on("join_admin_room", () => {
    socket.join("admin_room");
  });
  socket.on("disconnect", () => {});
});

// --- CẤU HÌNH MIDDLEWARE ---

app.use(helmet({
    crossOriginResourcePolicy: false,
}));

app.use(cors({
    origin: '*', 
    credentials: true
}));
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true })); 

// ✅ THAY THẾ xss-clean BẰNG HÀM TỰ VIẾT (An toàn hơn, không gây lỗi)
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (!obj) return;
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Chuyển đổi ký tự nguy hiểm thành vô hại (< -> &lt;)
                obj[key] = obj[key].replace(/</g, "&lt;").replace(/>/g, "&gt;");
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };
    
    // Chỉ làm sạch body và params, tránh đụng vào query nếu nó bị khóa
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    // Nếu req.query tồn tại và sửa được thì sửa, không thì thôi
    try { if (req.query) sanitize(req.query); } catch (e) {}
    
    next();
});

app.use(hpp()); 

const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 300, 
  message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.'
});
app.use('/api', globalLimiter);

// --- ROUTES ---

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/', (req, res) => { res.send('🚀 Server FoodMap Running Secured!'); });

app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);

require('./routes/review.routes')(app);
try { require('./routes/menu.routes')(app); } catch (e) {}

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ success: false, message: "Lỗi server!", error: err.message });
});

server.listen(PORT, () => {
  console.log(`🚀 Server & Socket chạy tại: http://localhost:${PORT}`);
});