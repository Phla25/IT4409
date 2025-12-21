// backend/services/review.service.js

// 👇 THAY ĐỔI QUAN TRỌNG: Dùng db từ config để chạy SQL thuần (thay vì dùng entities/Sequelize)
const db = require("../config/db.config"); 
const ReviewModel = require("../models/review.model"); 

class ReviewService {
  
  /**
   * 1. Tạo đánh giá mới
   */
  async createReview(data) {
    const { location_id, user_id, rating, comment, review_type } = data;

    // --- BƯỚC 1: KIỂM TRA USER & ROLE ---
    // SQL: Lấy user theo ID
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);
    const user = userResult.rows[0];

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    
    // Kiểm tra role
    if (user.role !== 'user') { 
      throw new Error("FORBIDDEN_NOT_RESIDENT");
    }

    // --- BƯỚC 2: INSERT REVIEW VÀO DB ---
    const insertSql = `
      INSERT INTO reviews (
        location_id, user_id, rating, comment, review_type, is_approved, created_at)
      VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
      RETURNING *;
    `;
    
    const reviewResult = await db.query(insertSql, [
      location_id, 
      user_id, 
      rating, 
      comment, 
      review_type || 'location'
    ]);
    
    const newReview = reviewResult.rows[0];

    // --- BƯỚC 3: TÍNH LẠI ĐIỂM TRUNG BÌNH (Chạy ngầm) ---
    this.updateLocationStats(location_id);

    return newReview;
  }

  /**
   * 2. Lấy danh sách đánh giá
   */
  async getReviewsByLocation(locationId) {
    // SQL: Join bảng reviews với bảng users để lấy thông tin người chat
    const sql = `
      SELECT 
        r.*, 
        u.username, 
        u.avatar_url, 
        u.role 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.location_id = $1 
        AND r.review_type = 'location' 
        AND r.is_approved = TRUE
      ORDER BY r.created_at DESC;
    `;

    const result = await db.query(sql, [locationId]);
    const rows = result.rows;

    // Map dữ liệu thô từ SQL sang format mà ReviewModel cần
    // Vì ReviewModel mong đợi structure: { ..., user: { username, ... } }
    const reviewModels = rows.map(row => {
      // Giả lập lại object entity như Sequelize
      const entity = {
        ...row,
        user: {
          username: row.username,
          avatar_url: row.avatar_url,
          role: row.role
        }
      };
      return new ReviewModel(entity);
    });

    return reviewModels;
  }

  /**
   * 3. Tính toán lại Average Rating & Update Location
   */
  async updateLocationStats(locationId) {
    try {
      // BƯỚC A: Tính toán AVG và COUNT
      const calcSql = `
        SELECT 
          AVG(rating) as avg_rating, 
          COUNT(id) as count 
        FROM reviews
        WHERE location_id = $1 AND review_type = 'location';
      `;
      
      const calcResult = await db.query(calcSql, [locationId]);
      const stats = calcResult.rows[0];

      const avgRating = stats.avg_rating ? parseFloat(stats.avg_rating) : 0;
      const count = stats.count ? parseInt(stats.count) : 0;

      // BƯỚC B: Update vào bảng locations
      const updateSql = `
        UPDATE locations 
        SET average_rating = $1, review_count = $2 
        WHERE id = $3;
      `;

      await db.query(updateSql, [avgRating, count, locationId]);
      
    } catch (error) {
      console.error("Service Error: Không thể cập nhật rating", error);
    }
  }
}

module.exports = new ReviewService();