const db = require('../config/db.config');
const BaseDish = require('../models/baseDish.model');

class BaseDishService {
  
  // Tạo món mới (Admin nhập)
  async create({ name, description }) {
    if (!name) throw new Error("Tên món không được để trống");
    
    // Kiểm tra trùng tên (Optional - tốt cho UX)
    const checkSql = `SELECT id FROM basedishes WHERE name ILIKE $1`;
    const checkRes = await db.query(checkSql, [name.trim()]);
    if (checkRes.rows.length > 0) throw new Error("Món này đã có trong hệ thống");

    const sql = `
      INSERT INTO basedishes (name, description, created_at)
      VALUES ($1, $2, NOW())
      RETURNING *;
    `;
    const result = await db.query(sql, [name.trim(), description]);
    return new BaseDish(result.rows[0]);
  }

  // Tìm kiếm món ăn (để gợi ý cho Admin khi thêm vào menu quán)
  async search(keyword) {
    if (!keyword) return [];
    
    const sql = `SELECT * FROM basedishes WHERE name ILIKE $1 LIMIT 20`;
    const result = await db.query(sql, [`%${keyword}%`]);
    
    return result.rows.map(row => new BaseDish(row));
  }
  
  // Lấy tất cả (nếu cần dropdown list)
  async getAll() {
    const sql = `SELECT * FROM basedishes ORDER BY name ASC`;
    const result = await db.query(sql);
    return result.rows.map(row => new BaseDish(row));
  }
  
}

module.exports = new BaseDishService();