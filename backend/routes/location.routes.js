// backend/routes/location.routes.js
const express = require('express');
const router = express.Router();

// Import Controller & Middleware
const locationController = require('../controllers/location.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// ==========================================
// 1. PUBLIC ROUTES (Ai cũng xem được)
// ==========================================

// Lấy danh sách địa điểm hiển thị lên bản đồ (Chỉ lấy cái đã duyệt)
router.get('/', locationController.getAllLocations);

// Gợi ý địa điểm gần bạn (Theo bán kính)
router.get('/nearby', locationController.getNearbyLocations);

// ==========================================
// 2. USER ROUTES (Cần đăng nhập)
// ==========================================

// User đề xuất địa điểm mới (Hoặc Admin tạo nhanh)
// LƯU Ý: Chỉ cần verifyToken. Trong Controller sẽ kiểm tra:
// - Nếu là User -> Tạo với status "pending" (Chờ duyệt)
// - Nếu là Admin -> Tạo với status "approved" (Hiện luôn)
router.post(
  '/propose', 
  authMiddleware.verifyToken, 
  locationController.createLocation
);

// ==========================================
// 3. ADMIN ROUTES (Chỉ Admin được truy cập)
// ==========================================

// Lấy TOÀN BỘ địa điểm (Bao gồm cả chưa duyệt để quản lý)
router.get(
  '/admin/all', 
  [authMiddleware.verifyToken, authMiddleware.isAdmin], 
  locationController.getAllLocationsForAdmin
);

// Import hàng loạt từ Excel
router.post(
  '/batch',
  [authMiddleware.verifyToken, authMiddleware.isAdmin],
  locationController.batchCreateLocations
);

// Cập nhật địa điểm (Duyệt bài, sửa thông tin)
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

// ==========================================
// 4. PUBLIC DETAIL (Đặt cuối cùng)
// ==========================================

// Xem chi tiết một địa điểm
// (Controller sẽ tự xử lý: Admin xem được hết, User chỉ xem được cái đã duyệt)
router.get('/:id', locationController.getLocationById);

module.exports = router;