// backend/server.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors'); 
const locationRoutes = require('./routes/location.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); 
app.use(cors()); 

// Route gốc (Tùy chọn)
app.get('/', (req, res) => {
  res.send('Bản đồ Ăn uống Hà Nội API đang chạy!');
});

// Gắn Routes
app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});

// Khởi tạo kết nối DB
require('./config/db.config.js');