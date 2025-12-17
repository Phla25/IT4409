// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// --- PUBLIC ROUTES ---
router.post('/register', authController.register);       // Đăng ký
router.post('/login', authController.login);             // Đăng nhập User
router.post('/admin/login', authController.adminLogin);  // Đăng nhập Admin

// --- PROTECTED ROUTES ---
// Đăng xuất (Thực tế chỉ cần ở Client xóa token, nhưng gọi API để clear cookie nếu có)
router.post('/logout', verifyToken, authController.logout); 

module.exports = router;