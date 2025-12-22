// backend/routes/location.routes.js
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const uploadCloud = require('../config/cloudinary.config');
// --- 1. CÁC ROUTE TĨNH (STATIC ROUTES) ---
// (Đặt các route cụ thể lên đầu)

// Public routes
router.get('/', locationController.getAllLocations);
router.get('/nearby', locationController.getNearbyLocations);
router.get('/search', locationController.searchLocations);
router.get('/recommendations/dishes', locationController.getDishRecommendations);

// Admin-only routes (PHẢI ĐẶT TRƯỚC /:id)
router.get(
  '/admin/all', 
  [authMiddleware.verifyToken, authMiddleware.isAdmin], 
  locationController.getAllLocationsForAdmin
);

// Authenticated routes
// 👇 THÊM DÒNG NÀY ĐỂ SỬA LỖI 404
router.post(
  '/', 
  authMiddleware.verifyToken, 
  locationController.createLocation
);

router.post(
  '/propose', 
  authMiddleware.verifyToken, 
  locationController.createLocation
);

router.post(
  '/batch',
  [authMiddleware.verifyToken, authMiddleware.isAdmin],
  locationController.batchCreateLocations
);

router.get(
  '/admin/pending-count', 
  [authMiddleware.verifyToken, authMiddleware.isAdmin], 
  locationController.getPendingCount
);
router.post(
  '/', 
  authMiddleware.verifyToken, // (Nếu có)
  uploadCloud.array('images', 10), // 📸 Cho phép up tối đa 10 ảnh, tên field là 'images'
  locationController.createLocation
);

// 2. Route Thêm ảnh vào địa điểm cũ (API mới)
router.post(
  '/:id/images',
  authMiddleware.verifyToken,
  uploadCloud.array('images', 10), 
  locationController.addImagesToLocation
);

// --- 2. CÁC ROUTE ĐỘNG (DYNAMIC ROUTES) ---
// (Các route có tham số :id phải đặt xuống cuối cùng)

// Lấy chi tiết địa điểm (Đã chuyển xuống đây)
router.get('/:id', authMiddleware.verifyTokenOptional, locationController.getLocationById);

// Cập nhật địa điểm
router.put(
  '/:id', 
  [authMiddleware.verifyToken, authMiddleware.isAdmin], 
  locationController.updateLocation
);

// Xóa địa điểm 
router.delete(
  '/:id', 
  [authMiddleware.verifyToken, authMiddleware.isAdmin], 
  locationController.deleteLocation
);

module.exports = router;