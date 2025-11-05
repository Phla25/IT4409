// backend/config/db.config.js
require('dotenv').config(); 
const { Pool } = require('pg');
const fs = require('fs');

// Khởi tạo Pool kết nối từ biến môi trường
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    // Đọc chứng chỉ từ file
    ca: fs.readFileSync('./config/ca.pem').toString(), 
    rejectUnauthorized: true, // Vẫn yêu cầu chứng chỉ hợp lệ
  }
});

// Kiểm tra kết nối
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Lỗi khi kết nối đến PostgreSQL:', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Lỗi truy vấn kiểm tra:', err.stack);
    }
    console.log('Đã kết nối thành công đến PostgreSQL tại:', result.rows[0].now);
  });
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};