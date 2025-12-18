const db = require('../config/db.config');
const MenuItem = require('../models/menuItem.model');

class MenuService {

  // Lấy thực đơn của quán
  async getMenuByLocation(locationId) {
    const sql = `
      SELECT mi.*, bd.name as base_dish_name 
      FROM menuitems mi
      JOIN basedishes bd ON mi.base_dish_id = bd.id
      WHERE mi.location_id = $1
      ORDER BY mi.id DESC;
    `;
    const result = await db.query(sql, [locationId]);
    return result.rows.map(row => new MenuItem(row));
  }

  // Thêm món vào thực đơn quán
  async addMenuItem(locationId, data) {
    if (data.price < 0) throw new Error("Giá tiền không hợp lệ");
    if (!data.base_dish_id) throw new Error("Chưa chọn món ăn");

    const sql = `
      INSERT INTO menuitems (
        location_id, base_dish_id, custom_name, price, description, 
        is_available, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW())
      RETURNING *;
    `;
    
    const params = [
        locationId, 
        data.base_dish_id, 
        data.custom_name, 
        data.price, 
        data.description
    ];
    
    const result = await db.query(sql, params);
    return new MenuItem(result.rows[0]);
  }

  // Cập nhật món (Giá, Tên riêng, Trạng thái)
  async updateMenuItem(itemId, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    // Chỉ cho phép update các trường này
    const allowedUpdates = ['custom_name', 'price', 'description', 'is_available'];

    for (const key in data) {
      if (allowedUpdates.includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(itemId);

    const sql = `
      UPDATE menuitems 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *;
    `;

    const result = await db.query(sql, values);
    return result.rows[0] ? new MenuItem(result.rows[0]) : null;
  }

  // Xóa món khỏi menu
  async deleteMenuItem(itemId) {
    const sql = `DELETE FROM menuitems WHERE id = $1`;
    await db.query(sql, [itemId]);
    return true;
  }
}

module.exports = new MenuService();