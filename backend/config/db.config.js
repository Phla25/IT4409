// Sử dụng dotenv để đọc biến môi trường như cũ
require('dotenv').config();

module.exports = {
  // Thay thế các giá trị này bằng thông tin đăng nhập PostgreSQL của bạn
  HOST: "it4409-lamcaro12212332-9c35.b.aivencloud.com",
  USER: "avnadmin", // Thường là 'postgres'
  PASSWORD: "AVNS_zXp2bR3IsbkKWR9lEDO", // **Thay thế bằng mật khẩu của bạn**
  DB: "defaultdb",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};