// backend/services/favorite.service.js
const db = require("../config/db.config");

class FavoriteService {

  // 1. Toggle: Thích / Bỏ thích
  async toggleFavorite(userId, locationId) {
    // Check xem đã thích chưa (Lưu ý tên bảng là 'Favorites' hoặc 'favorites' tùy DB của bạn, thường Postgres không phân biệt nếu không có ngoặc kép)
    const checkSql = `SELECT * FROM Favorites WHERE user_id = $1 AND location_id = $2`;
    const checkResult = await db.query(checkSql, [userId, locationId]);

    if (checkResult.rows.length > 0) {
      // Đã tồn tại -> XÓA
      await db.query(`DELETE FROM Favorites WHERE user_id = $1 AND location_id = $2`, [userId, locationId]);
      return { status: 'removed', message: "Đã xóa khỏi danh sách yêu thích" };
    } else {
      // Chưa tồn tại -> THÊM
      // ⚠️ QUAN TRỌNG: Chỉ insert created_at, KHÔNG insert updated_at
      const insertSql = `
        INSERT INTO Favorites (user_id, location_id, created_at) 
        VALUES ($1, $2, NOW())
      `;
      await db.query(insertSql, [userId, locationId]);
      return { status: 'added', message: "Đã thêm vào danh sách yêu thích" };
    }
  }

  // 2. Lấy danh sách yêu thích
  async getFavorites(userId) {
    // Join bảng Locations để lấy thông tin hiển thị
    // Chú ý: Dùng tên bảng "Locations" và "Favorites" khớp với các file model trước đó
    const sql = `
      SELECT l.* FROM Locations l
      JOIN Favorites f ON l.id = f.location_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC;
    `;
    const result = await db.query(sql, [userId]);
    return result.rows;
  }

  // 3. Check trạng thái (để tô đỏ trái tim)
  async checkIsFavorited(userId, locationId) {
    const sql = `SELECT 1 FROM Favorites WHERE user_id = $1 AND location_id = $2`;
    const result = await db.query(sql, [userId, locationId]);
    return result.rows.length > 0;
  }
}

module.exports = new FavoriteService();