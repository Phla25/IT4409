// backend/routes/favorite.routes.js
const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { verifyToken } = require('../middlewares/auth.middleware'); // Import middleware xác thực của bạn

// Tất cả các route này đều cần đăng nhập
router.post('/toggle', [verifyToken], favoriteController.toggle);
router.get('/', [verifyToken], favoriteController.getMyFavorites);
router.get('/check', [verifyToken], favoriteController.checkStatus);

module.exports = router;