// backend/routes/location.routes.js
const express = require('express');
const router = express.Router();

// Import Controller & Middleware
const locationController = require('../controllers/location.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const uploadCloud = require('../config/cloudinary.config');
// --- 1. CÁC ROUTE TĨNH (STATIC ROUTES) ---
// (Đặt các route cụ thể lên đầu)

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
  (req, res, next) => {
      // Middleware debug để bắt lỗi của uploadCloud
      uploadCloud.array('images', 10)(req, res, (err) => {
          if (err) {
              console.error("🔥 LỖI UPLOAD (MIDDLEWARE):", err);
              // Trả lỗi chi tiết về frontend để bạn xem
              return res.status(500).json({ 
                  success: false, 
                  message: "Lỗi Upload ảnh: " + (err.message || err), 
                  error_detail: err 
              });
          }
          // Nếu không lỗi thì đi tiếp vào Controller
          next();
      });
  },
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
// ROUTE XÓA ẢNH (Chỉ Admin mới được xóa)
router.delete(
  '/images/:imageId', 
  [authMiddleware.verifyToken, authMiddleware.isAdmin], 
  locationController.deleteLocationImage
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