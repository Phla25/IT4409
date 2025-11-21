// backend/server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Tự động tìm file .env ở thư mục gốc

// --- 1. KIỂM TRA PATH ---
// Nếu cấu trúc thư mục là backend/src/routes thì phải trỏ vào ./src/...
// Nếu bạn để file server.js nằm CÙNG CẤP với folder routes thì giữ nguyên ./routes/...
const locationRoutes = require('./routes/location.routes');
const authRoutes = require('./routes/auth.routes');

// Khởi tạo App
const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. MIDDLEWARES ---
app.use(cors()); // Cho phép Frontend (React) gọi API
app.use(express.json()); // Cho phép đọc JSON từ body request
app.use(express.urlencoded({ extended: true })); // Cho phép đọc data từ form

// Cấu hình để hiển thị ảnh tĩnh (Nếu bạn lưu ảnh user upload vào folder uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 3. ROUTES ---
app.get('/', (req, res) => {
  res.send('🚀 Server Bản đồ Ẩm thực Hà Nội đang chạy!');
});

// Gắn API Routes
app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);

// --- 4. GLOBAL ERROR HANDLER (Quan trọng cho Frontend) ---
// Middleware bắt lỗi tập trung, giúp Frontend nhận JSON lỗi thay vì HTML loằng ngoằng
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Đã xảy ra lỗi phía server!",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// --- 5. DATABASE & SERVER START ---
// Import DB connection (Chỉ chạy sau khi server đã sẵn sàng hoặc trước khi listen)
const db = require('./config/db.config'); // Sửa path trỏ vào src

// (Tùy chọn) Sync database nếu muốn tự tạo bảng (Chỉ dùng lúc dev)
// db.sequelize.sync(); 

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📁 Thư mục gốc: ${__dirname}`);
  // Tuyệt đối không log JWT_SECRET ra console môi trường production
  if (process.env.NODE_ENV !== 'production') {
     console.log(`🔑 JWT Secret: Loaded`); 
  }
  console.log(`=================================`);
});