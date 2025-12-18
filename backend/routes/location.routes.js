// backend/routes/location.routes.js
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// --- 1. CÁC ROUTE TĨNH (STATIC ROUTES) ---
// (Đặt các route cụ thể lên đầu)

// Public routes
router.get('/', locationController.getAllLocations);
router.get('/nearby', locationController.getNearbyLocations);
router.get('/search', locationController.searchLocations);

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