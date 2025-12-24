// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// 1. 👇 IMPORT THÊM loginLimiter TỪ MIDDLEWARE
const { verifyToken, loginLimiter } = require('../middlewares/auth.middleware');

// --- PUBLIC ROUTES ---
router.post('/register', authController.register);

// 2. 👇 GẮN loginLimiter VÀO CÁC ROUTE ĐĂNG NHẬP
// (Nó sẽ chặn nếu 1 IP spam đăng nhập sai quá 5 lần)
router.post('/login', loginLimiter, authController.login);             
router.post('/admin/login', loginLimiter, authController.adminLogin);  

// --- PROTECTED ROUTES ---
router.post('/logout', verifyToken, authController.logout); 

module.exports = router;