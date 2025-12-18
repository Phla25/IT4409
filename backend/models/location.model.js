// backend/models/location.model.js

// Import db từ file config (nơi bạn vừa thêm hàm query)
const db = require('../config/db.config'); 

class Location {
  
  // [READ ALL] Lấy tất cả địa điểm đã duyệt
  static async getAllLocationsForMap() {
    const sql = `
      SELECT 
        id, name, description, address, district, 
        latitude, longitude, phone_number, 
        min_price, max_price, average_rating, review_count, is_approved
      FROM locations
      WHERE is_approved = TRUE;
    `;
    // Dùng db.query (của thư viện pg)
    const result = await db.query(sql);
    return result.rows; 
  }

  // [ADMIN READ ALL]
  static async getAllForAdmin() {
    const sql = `
      SELECT 
        l.id, l.name, l.description, l.address, l.district, 
        l.latitude, l.longitude, l.phone_number, 
        l.min_price, l.max_price, l.average_rating, l.review_count, 
        l.is_approved, l.created_by_user_id,
        u.username as created_by_username
      FROM locations l
      LEFT JOIN users u ON l.created_by_user_id = u.id
      ORDER BY l.is_approved ASC, l.id ASC;
    `;
    const result = await db.query(sql);
    return result.rows;
  }

  // ✨ [FIX LỖI HERE] Dùng db.query thay vì sequelize.query
  static async getNearby(userLat, userLng, radiusKm) {
    const radiusMiles = radiusKm / 1.60934; 
    
    // Lưu ý: Vẫn cần extension 'cube' và 'earthdistance' trong DB
    const sql = `
      SELECT 
        id, name, description, address, district, 
        latitude, longitude, phone_number, 
        min_price, max_price, average_rating, review_count, is_approved,
        (point($2, $1) <@> point(longitude, latitude)) * 1.60934 AS distance_km
      FROM locations
      WHERE is_approved = TRUE 
        AND (point($2, $1) <@> point(longitude, latitude)) <= $3 
      ORDER BY distance_km;
    `;

    // Cú pháp của 'pg': db.query(sql, [params])
    const result = await db.query(sql, [userLat, userLng, radiusMiles]);
    return result.rows;
  }

  // [CRUD] CREATE
  static async create({ name, description, address, district, latitude, longitude, phone_number, min_price, max_price, created_by_user_id, is_approved}) {
    const sql = `
      INSERT INTO locations (
        name, description, address, district, latitude, longitude, 
        phone_number, min_price, max_price, created_by_user_id, is_approved, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *;
    `;
    
    const result = await db.query(sql, [name, description, address, district, latitude, longitude, phone_number, min_price, max_price, created_by_user_id, is_approved]);
    return result.rows[0];
  }

  // [CRUD] READ Single
  static async findById(id) {
    const sql = `
      SELECT 
        id, name, description, address, district, 
        latitude, longitude, phone_number, 
        min_price, max_price, average_rating, review_count, is_approved
      FROM locations 
      WHERE id = $1;
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0];
  }

  // [CRUD] UPDATE
  static async update(id, data) {
    const fields = [], values = [];
    let paramIndex = 1;

    for (const key in data) {
      if ([
        'name', 'description', 'address', 'district',
        'latitude', 'longitude', 'phone_number',
        'min_price', 'max_price', 'is_approved'
      ].includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(data[key]);
        paramIndex++;
      }
    }

    if (fields.length === 0) throw new Error("Không có trường dữ liệu hợp lệ để cập nhật.");
    values.push(id);

    const sql = `
      UPDATE locations 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} 
      RETURNING *;
    `;
    
    const result = await db.query(sql, values);
    return result.rows[0];
  }

  // [CRUD] DELETE
  static async delete(id) {
    const sql = 'DELETE FROM locations WHERE id = $1 RETURNING id;';
    const result = await db.query(sql, [id]);
    return result.rows[0];
  }

  // [CRUD] Bulk Create (Giữ nguyên logic SQL raw cho an toàn với pg)
  static async bulkCreate(locations = []) {
    if (!Array.isArray(locations) || locations.length === 0)
        throw new Error("Danh sách rỗng.");

    const values = [];
    const placeholders = [];

    locations.forEach((loc, i) => {
      const idx = i * 10;
      placeholders.push(`($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10})`);
      values.push(
        loc.name || '',
        loc.description || '',
        loc.address || '',
        loc.district || '',
        loc.latitude || 0,
        loc.longitude || 0,
        loc.phone_number || '',
        loc.min_price || 0,
        loc.max_price || 0,
        loc.is_approved === true
      );
    });

    const sql = `
      INSERT INTO locations (
        name, description, address, district, latitude, longitude,
        phone_number, min_price, max_price, is_approved
      )
      VALUES ${placeholders.join(', ')}
      RETURNING id, name, district;
    `;

    const result = await db.query(sql, values);
    return result.rows;
  }
  static async search(keyword) {
    if (!keyword) return [];

    const searchTerm = `%${keyword}%`; // Thêm % để tìm kiếm gần đúng (Partial match)

    // Lưu ý: Tên bảng trong SQL dưới đây mình để chữ thường (locations, categories...) 
    // để khớp với DB PostgreSQL mặc định.
    const sql = `
      SELECT DISTINCT l.* FROM locations l
      
      -- Join bảng Danh mục (để tìm: "Quán Cafe", "Sân vườn"...)
      LEFT JOIN locationcategories lc ON l.id = lc.location_id
      LEFT JOIN categories c ON lc.category_id = c.id
      
      -- Join bảng Món ăn (để tìm: "Phở", "Trà sữa"...)
      LEFT JOIN menuitems mi ON l.id = mi.location_id
      LEFT JOIN basedishes bd ON mi.base_dish_id = bd.id
      
      WHERE l.is_approved = TRUE
      AND (
           l.name ILIKE $1          -- Tìm theo tên quán
        OR l.address ILIKE $1       -- Tìm theo địa chỉ
        OR l.district ILIKE $1      -- Tìm theo quận
        OR c.name ILIKE $1          -- Tìm theo tên danh mục
        OR bd.name ILIKE $1         -- Tìm theo tên món gốc
        OR mi.custom_name ILIKE $1  -- Tìm theo tên món riêng tại quán
      )
      ORDER BY l.average_rating DESC
      LIMIT 20;
    `;
    
    // ILIKE là lệnh so sánh không phân biệt hoa thường của PostgreSQL
    const result = await db.query(sql, [searchTerm]);
    return result.rows;
  }
}

module.exports = Location;