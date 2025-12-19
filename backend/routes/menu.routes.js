const menuController = require('../controllers/menu.controller');
// Import Middleware xác thực để bảo vệ các route Admin
const authMiddleware = require('../middlewares/auth.middleware'); 

module.exports = app => {
    const router = require('express').Router();

    // ==========================================
    // 1. QUẢN LÝ KHO MÓN ĂN (BASE DISHES - SYSTEM)
    // ==========================================
    
    // [ADMIN] Tạo món ăn gốc mới vào hệ thống
    // API: POST /api/base-dishes
    router.post(
        '/base-dishes', 
        [authMiddleware.verifyToken, authMiddleware.isAdmin], 
        menuController.createBaseDish
    );
    // ✨ [MỚI] Lấy tất cả món (Để hiển thị list)
    router.get('/base-dishes', authMiddleware.verifyToken, menuController.getAllBaseDishes);

    // ✨ [MỚI] Cập nhật món (Sửa mô tả, tên)
    router.put('/base-dishes/:id', [authMiddleware.verifyToken, authMiddleware.isAdmin], menuController.updateBaseDish);

    // [AUTH] Tìm kiếm món ăn gốc (để Admin chọn khi thêm vào quán)
    // API: GET /api/base-dishes/search?keyword=...
    router.get(
        '/base-dishes/search', 
        authMiddleware.verifyToken, 
        menuController.searchBaseDishes
    );

    // ==========================================
    // 2. QUẢN LÝ THỰC ĐƠN CỦA QUÁN (MENU ITEMS)
    // ==========================================

    // [PUBLIC] Xem thực đơn của một quán (Ai cũng xem được)
    // API: GET /api/locations/:locationId/menu
    router.get(
        '/locations/:locationId/menu', 
        menuController.getLocationMenu
    );

    // [ADMIN] Thêm món vào thực đơn của quán
    // API: POST /api/locations/:locationId/menu
    router.post(
        '/locations/:locationId/menu', 
        [authMiddleware.verifyToken, authMiddleware.isAdmin], 
        menuController.addMenuItem
    );

    // [ADMIN] Cập nhật món trong thực đơn (Sửa giá, tên riêng, trạng thái)
    // API: PUT /api/menu-items/:itemId
    router.put(
        '/menu-items/:itemId', 
        [authMiddleware.verifyToken, authMiddleware.isAdmin], 
        menuController.updateMenuItem
    );

    // [ADMIN] Xóa món khỏi thực đơn
    // API: DELETE /api/menu-items/:itemId
    router.delete(
        '/menu-items/:itemId', 
        [authMiddleware.verifyToken, authMiddleware.isAdmin], 
        menuController.deleteMenuItem
    );

    // Gắn router vào đường dẫn gốc /api
    app.use('/api', router);
};