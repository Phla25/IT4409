// backend/routes/location.routes.js
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// ==========================================
// ✨ [FIX] SẮP XẾP LẠI ROUTE THEO ĐÚNG THỨ TỰ ƯU TIÊN
// Nguyên tắc: Route tĩnh (static) phải được khai báo TRƯỚC route động (dynamic).
// ==========================================

// --- 1. CÁC ROUTE TĨNH (STATIC ROUTES) ---

// Public routes
router.get('/', locationController.getAllLocations);
router.get('/nearby', locationController.getNearbyLocations);
router.get('/:id', authMiddleware.verifyTokenOptional, locationController.getLocationById);

// Admin-only routes
router.get(
  '/admin/all', 
  [authMiddleware.verifyToken, authMiddleware.isAdmin], 
  locationController.getAllLocationsForAdmin
);

// Authenticated routes
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
// Các route này phải được đặt CUỐI CÙNG để không "chặn" các route tĩnh ở trên.

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