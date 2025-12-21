const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// --- 1. CÁC ROUTE TĨNH (STATIC ROUTES) ---

// Public routes
router.get('/', locationController.getAllLocations);
router.get('/nearby', locationController.getNearbyLocations);
router.get('/search', locationController.searchLocations);
router.get('/recommendations/dishes', locationController.getDishRecommendations);

// Admin-only routes
router.get(
  '/admin/all', 
  [authMiddleware.verifyToken, authMiddleware.isAdmin], 
  locationController.getAllLocationsForAdmin
);

router.get(
  '/admin/pending-count', 
  [authMiddleware.verifyToken, authMiddleware.isAdmin], 
  locationController.getPendingCount
);

// Authenticated routes
router.post(
  '/', 
  authMiddleware.verifyToken, 
  locationController.createLocation
);

// Alias cho create location
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

// --- 2. CÁC ROUTE ĐỘNG (DYNAMIC ROUTES) - Đặt sau cùng ---

// 👇 Route Upload Ảnh (Mới thêm)
// URL: /api/locations/:id/images
router.post(
    '/:id/images',
    [authMiddleware.verifyToken, locationController.uploadMiddleware], 
    locationController.uploadLocationImage
);

// Lấy chi tiết
router.get('/:id', authMiddleware.verifyTokenOptional, locationController.getLocationById);

// Cập nhật
router.put(
  '/:id', 
  [authMiddleware.verifyToken, authMiddleware.isAdmin], 
  locationController.updateLocation
);

// Xóa
router.delete(
  '/:id', 
  [authMiddleware.verifyToken, authMiddleware.isAdmin], 
  locationController.deleteLocation
);

module.exports = router;