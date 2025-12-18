// backend/controllers/location.controller.js
const Location = require('../models/location.model');

// [PUBLIC] Lấy tất cả địa điểm (Thường dùng cho hiển thị Map ban đầu)
exports.getAllLocations = async (req, res) => {
  try {
    // Chỉ lấy các địa điểm ĐÃ ĐƯỢC DUYỆT (is_approved = true) cho public API
    // Nếu logic model của bạn chưa lọc, hãy đảm bảo Model có hàm filter hoặc controller phải lọc
    const locations = await Location.getAllLocationsForMap(); 
    
    // Giả sử Model trả về hết, ta lọc ở đây để an toàn nếu là guest
    const visibleLocations = locations.filter(loc => loc.is_approved);

    res.status(200).json({ 
        success: true, 
        count: visibleLocations.length, 
        data: visibleLocations 
    });
  } catch (error) {
    console.error("Error getAllLocations:", error);
    res.status(500).json({ message: "Lỗi server khi tải dữ liệu bản đồ." });
  }
};

// [PUBLIC] Gợi ý địa điểm gần người dùng (Tìm kiếm theo bán kính)
exports.getNearbyLocations = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query; 

    // 1. Validate Input
    if (!lat || !lng) {
        return res.status(400).json({ message: "Yêu cầu cung cấp tọa độ (lat, lng)." });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadiusKm = parseFloat(radius) || 5.0; // Mặc định 5km nếu không gửi lên

    if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({ message: "Tọa độ không hợp lệ." });
    }

    // 2. Gọi Model xử lý (Model cần sử dụng công thức Haversine hoặc PostGIS)
    const locations = await Location.getNearby(userLat, userLng, searchRadiusKm);

    // 3. Lọc chỉ lấy địa điểm đã duyệt (Nếu Model chưa lọc)
    const approvedLocations = locations.filter(loc => loc.is_approved);

    res.status(200).json({ 
        success: true, 
        count: approvedLocations.length, 
        radius_km: searchRadiusKm,
        data: approvedLocations 
    });

  } catch (error) {
    console.error("Lỗi tìm kiếm gần đây:", error);
    res.status(500).json({ message: "Lỗi server khi tìm địa điểm gần bạn." });
  }
};

// [ADMIN] Lấy tất cả địa điểm (Bao gồm cả chưa duyệt)
exports.getAllLocationsForAdmin = async (req, res) => {
    try {
        // ✨ Sửa đổi: Gọi phương thức `getAllForAdmin` vừa tạo trong model
        const locations = await Location.getAllForAdmin(); 
        
        res.status(200).json({ 
            success: true, 
            count: locations.length, 
            data: locations 
        });
    } catch (error) {
        console.error("Admin get all error:", error);
        res.status(500).json({ message: "Lỗi server khi lấy danh sách quản trị." });
    }
};

// [USER/ADMIN] Xem chi tiết 1 địa điểm
exports.getLocationById = async (req, res) => {
    try {
        const locationId = req.params.id;

        // ✨ [FIX] Thêm validation để chặn ID không hợp lệ (như "undefined" hoặc chữ)
        if (!locationId || isNaN(parseInt(locationId, 10))) {
            return res.status(400).json({ message: "ID địa điểm không hợp lệ." });
        }

        const location = await Location.findById(locationId);

        if (!location) {
            return res.status(404).json({ message: "Địa điểm không tồn tại." });
        }

        // Logic phân quyền xem:
        // - Nếu là Admin: Xem được mọi trạng thái.
        // - Nếu là User thường hoặc Khách: Chỉ xem được nếu is_approved = true.
        
        // ✨ [FIX] Kiểm tra req.user một cách an toàn để không bị lỗi khi user chưa đăng nhập
        // Toán tử !! đảm bảo isAdmin luôn là true/false.
        const isAdmin = !!(req.user && req.user.role === 'admin');
        
        if (!isAdmin && !location.is_approved) {
             return res.status(404).json({ message: "Địa điểm này đang chờ duyệt hoặc không khả dụng." });
        }

        // Tăng lượt xem (Optional - nếu có bảng tracking)
        // await Location.incrementViewCount(locationId);

        res.status(200).json({ success: true, data: location });
    } catch (error) {
        console.error("Get By ID error:", error);
        res.status(500).json({ message: "Lỗi server khi lấy thông tin địa điểm." });
    }
};

// [AUTH REQUIRED] Tạo địa điểm mới
exports.createLocation = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Vui lòng đăng nhập." });

        // Logic phân quyền: Admin tạo thì duyệt luôn, User tạo thì chờ duyệt
        const isAutoApproved = req.user.role === 'admin';

        const newLocationData = {
            ...req.body,
            created_by_user_id: req.user.id,
            is_approved: isAutoApproved, // User thường sẽ là FALSE
            created_at: new Date()
        };

        const newLocation = await Location.create(newLocationData);
        
        res.status(201).json({ 
            success: true, 
            message: isAutoApproved ? "Đã tạo địa điểm mới." : "Cảm ơn bạn! Địa điểm đang chờ Admin duyệt.",
            data: newLocation 
        });
    } catch (error) {
        console.error("Create Error:", error);
        res.status(500).json({ message: "Lỗi server." });
    }
};

// [ADMIN] Cập nhật địa điểm
exports.updateLocation = async (req, res) => {
    try {
        // Kiểm tra quyền sở hữu hoặc quyền Admin (tùy logic dự án)
        // Ở đây giả sử chỉ Admin hoặc chủ sở hữu mới được sửa
        const updatedLocation = await Location.update(req.params.id, req.body);
        
        if (!updatedLocation) {
            return res.status(404).json({ message: "Không tìm thấy địa điểm để cập nhật." });
        }
        
        res.status(200).json({ success: true, message: "Cập nhật thành công.", data: updatedLocation });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật." });
    }
};

// [ADMIN] Xóa địa điểm
exports.deleteLocation = async (req, res) => {
    try {
        const deleted = await Location.delete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy địa điểm để xóa." });
        
        res.status(200).json({ success: true, message: "Đã xóa địa điểm thành công." });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Lỗi server khi xóa." });
    }
};
exports.batchCreateLocations = async (req, res) => {
  try {
    // Logic tạm thời để tránh lỗi undefined
    res.status(200).json({ message: "Batch create working" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};
exports.searchLocations = async (req, res) => {
  try {
    const { keyword } = req.query; // Lấy keyword từ URL: ?keyword=phở

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm" });
    }

    const locations = await Location.search(keyword);
    
    return res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    console.error("Search Error:", error);
    return res.status(500).json({ message: "Lỗi khi tìm kiếm địa điểm" });
  }
};