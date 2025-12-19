const menuService = require('../services/menu.service');
const baseDishService = require('../services/baseDish.service'); // 👇 Import mới
const db = require('../config/db.config');
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
// ✨ [MỚI] Lấy toàn bộ danh sách món gốc (Mới nhất lên đầu)
exports.getAllBaseDishes = async (req, res) => {
    try {
        const sql = "SELECT * FROM basedishes ORDER BY id DESC";
        const result = await db.query(sql);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get All BaseDish Error:", error);
        res.status(500).json({ message: "Lỗi lấy danh sách món." });
    }
};

// ✨ [MỚI] Cập nhật thông tin món gốc (Tên, Mô tả)
exports.updateBaseDish = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name) return res.status(400).json({ message: "Tên món không được để trống" });

        const sql = `
            UPDATE basedishes 
            SET name = $1, description = $2 
            WHERE id = $3 
            RETURNING *
        `;
        const result = await db.query(sql, [name, description, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy món để sửa." });
        }

        res.status(200).json({ success: true, message: "Cập nhật thành công!", data: result.rows[0] });
    } catch (error) {
        console.error("Update BaseDish Error:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật." });
    }
};