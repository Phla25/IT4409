const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cấu hình thông tin tài khoản Cloudinary
// Bạn nên lấy các thông tin này từ Dashboard của Cloudinary và để vào file .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình nơi lưu trữ
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hanoi-food-map', // Tên thư mục trên Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Định dạng cho phép
    // transformation: [{ width: 500, height: 500, crop: 'limit' }] // (Tùy chọn) Tự động resize ảnh
  },
});

const uploadCloud = multer({ storage });

module.exports = uploadCloud;