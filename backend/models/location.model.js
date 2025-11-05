// backend/models/location.model.js
const db = require('../config/db.config.js');

class Location {
  // [READ ALL] Lấy tất cả địa điểm đã duyệt (cho bản đồ)
  static async getAllLocationsForMap() {
    const sql = `SELECT id, name, latitude, longitude, average_rating, review_count FROM Locations WHERE is_approved = TRUE;`;
    const result = await db.query(sql);
    return result.rows;
  }
  
  // [READ NEARBY] Lấy địa điểm gần đó (Geospatial Query)
  static async getNearby(userLat, userLng, radiusKm) {
    const radiusMiles = radiusKm / 1.60934; 
    const sql = `
      SELECT id, name, latitude, longitude, average_rating, review_count,
        (point($2, $1) <@> point(longitude, latitude)) * 1.60934 AS distance_km
      FROM Locations
      WHERE is_approved = TRUE AND (point($2, $1) <@> point(longitude, latitude)) <= $3 
      ORDER BY distance_km
    `;
    const result = await db.query(sql, [userLat, userLng, radiusMiles]);
    return result.rows;
  }

  // [CRUD] CREATE
  static async create({ name, description, address, district, latitude, longitude, phone_number, min_price, max_price, created_by_user_id }) {
    const sql = `INSERT INTO Locations (name, description, address, district, latitude, longitude, phone_number, min_price, max_price, created_by_user_id, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE) RETURNING *;`;
    const params = [name, description, address, district, latitude, longitude, phone_number, min_price, max_price, created_by_user_id];
    const result = await db.query(sql, params);
    return result.rows[0];
  }

  // [CRUD] READ Single
  static async findById(id) {
    const sql = 'SELECT * FROM Locations WHERE id = $1';
    const result = await db.query(sql, [id]);
    return result.rows[0];
  }

  // [CRUD] UPDATE
  static async update(id, data) {
    const fields = [], values = [];
    let paramIndex = 1;
    // ... (Logic tạo SQL UPDATE động, xem lại hướng dẫn trước) ...
    for (const key in data) {
      if (['name', 'description', 'address', 'district', 'latitude', 'longitude', 'phone_number', 'min_price', 'max_price', 'is_approved'].includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(data[key]);
        paramIndex++;
      }
    }
    if (fields.length === 0) throw new Error("Không có trường dữ liệu hợp lệ để cập nhật.");
    values.push(id);
    const sql = `UPDATE Locations SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
    const result = await db.query(sql, values);
    return result.rows[0];
  }

  // [CRUD] DELETE
  static async delete(id) {
    const sql = 'DELETE FROM Locations WHERE id = $1 RETURNING id';
    const result = await db.query(sql, [id]);
    return result.rows[0];
  }
}

module.exports = Location;