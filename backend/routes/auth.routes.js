const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Người dùng thường
router.post('/register', authController.register);
router.post('/login', authController.login);

// 🧩 Thêm route đăng nhập admin
router.post('/admin/login', authController.adminLogin);

module.exports = router;