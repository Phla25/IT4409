const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// 1. Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// 2. Cấu hình nơi lưu (Storage)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'foodmap_hanoi', // Tên thư mục sẽ tạo trên Cloudinary
    allowedFormats: ['jpg', 'png', 'jpeg'], // Chỉ cho phép up ảnh
  }
});

const uploadCloud = multer({ storage });

module.exports = uploadCloud;