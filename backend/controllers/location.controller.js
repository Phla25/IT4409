// backend/controllers/location.controller.js
const Location = require('../models/location.model');

// [READ ALL] Cho Bản đồ (Giữ nguyên)
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.getAllLocationsForMap();
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy địa điểm." });
  }
};

// [READ NEARBY] Gợi ý gần bạn (Giữ nguyên)
exports.getNearbyLocations = async (req, res) => {
  const { lat, lng, radius } = req.query; 
  if (!lat || !lng) return res.status(400).json({ message: "Thiếu thông số tọa độ." });
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const searchRadiusKm = parseInt(radius) || 5; 

  try {
    const locations = await Location.getNearby(userLat, userLng, searchRadiusKm);
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    console.error("Lỗi server khi lấy địa điểm gần đó:", error);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm địa điểm gần đây." });
  }
};

// *** [ĐÃ SỬA/THÊM] ADMIN READ ALL ***
exports.getAllLocationsForAdmin = async (req, res) => {
    try {
        const locations = await Location.getAllForAdmin(); 
        res.status(200).json({ success: true, count: locations.length, data: locations });
    } catch (error) {
        console.error("Lỗi server khi lấy tất cả địa điểm (Admin):", error);
        res.status(500).json({ message: "Lỗi server khi lấy danh sách Admin." });
    }
};

// [CRUD] CREATE (Giữ nguyên, nhưng giờ có Auth)
exports.createLocation = async (req, res) => {
    try {
        const newLocation = await Location.create({
            ...req.body,
            created_by_user_id: req.user.id // Lấy ID Admin từ Token
        });
        res.status(201).json({ success: true, data: newLocation });
    } catch (error) {
        console.error("Lỗi tạo địa điểm:", error);
        res.status(500).json({ message: "Không thể tạo địa điểm mới." });
    }
};

// [BATCH CREATE] Thêm nhiều địa điểm cùng lúc (Excel import)
exports.batchCreateLocations = async (req, res) => {
  try {
    const { locations } = req.body;
    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ message: 'Dữ liệu import không hợp lệ hoặc rỗng.' });
    }

    const result = await Location.bulkCreate(locations);
    res.status(201).json({
      message: 'Thêm hàng loạt thành công.',
      count: result.length,
      added: result
    });
  } catch (error) {
    console.error('Lỗi batch import:', error);
    res.status(500).json({ message: 'Lỗi khi thêm hàng loạt địa điểm.' });
  }
};

// [CRUD] READ Single (Giữ nguyên)
exports.getLocationById = async (req, res) => {
    try {
        // Lưu ý: Route này có thể cần sửa logic hiển thị tất cả nếu người dùng là Admin
        const location = await Location.findById(req.params.id);
        if (!location) { // Thêm check nếu Admin muốn xem cái chưa duyệt
            return res.status(404).json({ message: "Không tìm thấy địa điểm." });
        }
        // Giữ nguyên logic cũ: chỉ hiển thị nếu được duyệt cho non-admin
        if (!req.user || req.user.role !== 'admin') { 
             if (!location.is_approved) {
                 return res.status(404).json({ message: "Không tìm thấy địa điểm." });
             }
        }
        res.status(200).json({ success: true, data: location });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server." });
    }
};

// [CRUD] UPDATE (Giữ nguyên, giờ có Auth)
exports.updateLocation = async (req, res) => {
    try {
        const updatedLocation = await Location.update(req.params.id, req.body);
        if (!updatedLocation) return res.status(404).json({ message: "Không tìm thấy địa điểm để cập nhật." });
        res.status(200).json({ success: true, data: updatedLocation });
    } catch (error) {
        console.error("Lỗi cập nhật:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật." });
    }
};

// [CRUD] DELETE (Giữ nguyên, giờ có Auth)
exports.deleteLocation = async (req, res) => {
    try {
        const deletedLocation = await Location.delete(req.params.id);
        if (!deletedLocation) return res.status(404).json({ message: "Không tìm thấy địa điểm để xóa." });
        res.status(200).json({ success: true, message: "Địa điểm đã được xóa thành công." });
    } catch (error) {
        console.error("Lỗi xóa:", error);
        res.status(500).json({ message: "Lỗi server khi xóa." });
    }
};