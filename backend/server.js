// backend/server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config(); 

const locationRoutes = require('./routes/location.routes');
const authRoutes = require('./routes/auth.routes');
const favoriteRoutes = require('./routes/favorite.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/favorites', favoriteRoutes);
app.get('/', (req, res) => {
  res.send('🚀 Server Bản đồ Ẩm thực Hà Nội đang chạy!');
});

// --- GẮN API ROUTES ---
app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);

// ✨ [QUAN TRỌNG] Đăng ký route cho Review
require('./routes/review.routes')(app);

// 👇👇👇 THÊM DÒNG NÀY ĐỂ KÍCH HOẠT API MENU & BASE-DISHES 👇👇👇
try {
  require('./routes/menu.routes')(app);
} catch (error) {
  console.warn("⚠️ Chưa có file menu.routes.js hoặc lỗi cú pháp:", error.message);
}

// --- ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Đã xảy ra lỗi phía server!",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const db = require('./config/db.config'); 

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});