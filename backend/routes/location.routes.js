// backend/routes/location.routes.js (ĐÃ FIX LỖI 100%)
const express = require('express');
const router = express.Router();

// 1. Import Controllers
const locationController = require('../controllers/location.controller');

// 2. Import Middleware
const authMiddleware = require('../middlewares/auth.middleware');

// --- CÁC TUYẾN ĐƯỜNG CÔNG CỘNG (PUBLIC ROUTES) ---
// (Đặt trước các route có tham số động)
router.get('/', locationController.getAllLocations); // Lấy tất cả đã duyệt cho Map
router.get('/nearby', locationController.getNearbyLocations); // Gợi ý gần bạn

// --- PROTECTED ADMIN ROUTES (CRUD) ---
// Sử dụng mảng middleware [authMiddleware.verifyToken, authMiddleware.isAdmin]
// Đặt tuyến /admin trước tuyến /:id
router.get('/admin', [authMiddleware.verifyToken, authMiddleware.isAdmin], locationController.getAllLocationsForAdmin); 
router.post('/', [authMiddleware.verifyToken, authMiddleware.isAdmin], locationController.createLocation);
router.put('/:id', [authMiddleware.verifyToken, authMiddleware.isAdmin], locationController.updateLocation);
router.delete('/:id', [authMiddleware.verifyToken, authMiddleware.isAdmin], locationController.deleteLocation);

// --- TUYẾN ĐƯỜNG CÔNG CỘNG CÓ THAM SỐ (PHẢI ĐẶT CUỐI CÙNG) ---
router.get('/:id', locationController.getLocationById); 

module.exports = router;