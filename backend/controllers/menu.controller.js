const menuService = require('../services/menu.service');
const baseDishService = require('../services/baseDish.service'); // 👇 Import mới

// --- BASE DISH (Món ăn hệ thống) ---

exports.createBaseDish = async (req, res) => {
  try {
    // Gọi baseDishService
    const newDish = await baseDishService.create(req.body);
    res.status(201).json({ success: true, data: newDish, message: "Thêm món thành công!" });
  } catch (err) {
    res.status(400).json({ message: err.message || "Lỗi server" });
  }
};

exports.searchBaseDishes = async (req, res) => {
  try {
    const { keyword } = req.query;
    // Gọi baseDishService
    const dishes = await baseDishService.search(keyword || '');
    res.status(200).json({ success: true, data: dishes });
  } catch (err) {
    res.status(500).json({ message: "Lỗi tìm kiếm" });
  }
};

// --- MENU ITEM (Thực đơn quán) ---

exports.getLocationMenu = async (req, res) => {
  try {
    // Gọi menuService
    const menu = await menuService.getMenuByLocation(req.params.locationId);
    res.status(200).json({ success: true, data: menu });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy thực đơn" });
  }
};

exports.addMenuItem = async (req, res) => {
  try {
    const newItem = await menuService.addMenuItem(req.params.locationId, req.body);
    res.status(201).json({ success: true, data: newItem });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const updated = await menuService.updateMenuItem(req.params.itemId, req.body);
    if (!updated) return res.status(404).json({ message: "Không tìm thấy món" });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật" });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    await menuService.deleteMenuItem(req.params.itemId);
    res.status(200).json({ success: true, message: "Đã xóa món" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa món" });
  }
};