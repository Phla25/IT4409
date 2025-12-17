require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg'); // Import lại thư viện pg

// 1. Cấu hình SSL (Logic cũ của bạn)
const caPath = path.resolve(__dirname, 'ca.pem');
let sslConfig = null;

if (fs.existsSync(caPath)) {
    sslConfig = {
        require: true,
        rejectUnauthorized: true, 
        ca: fs.readFileSync(caPath).toString(),
    };
} else {
    console.warn("⚠️ Không tìm thấy ca.pem, dùng cấu hình SSL lỏng lẻo.");
    sslConfig = {
        require: true,
        rejectUnauthorized: false 
    };
}

// 2. Khởi tạo Pool kết nối (Dùng thư viện pg để chạy query trực tiếp)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: sslConfig // Dùng lại cấu hình SSL đã tạo ở trên
});

// Kiểm tra kết nối pg ngay lập tức để bạn yên tâm
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ [pg] Lỗi kết nối:', err.message);
    } else {
        console.log('✅ [pg] Đã kết nối thành công bằng thư viện pg!');
        release();
    }
});

// 3. Export cả Config (cho Sequelize) VÀ hàm query (cho bạn dùng)
module.exports = {
    // --- Phần này dành cho Sequelize (ở entities/index.js) ---
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    DB: process.env.DB_DATABASE,
    dialect: "postgres",
    dialectOptions: {
        ssl: sslConfig
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },

    // --- Phần này dành cho query trực tiếp (giống code cũ) ---
    query: (text, params) => pool.query(text, params),
    end: () => pool.end()
};