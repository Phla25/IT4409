class ReviewModel {
  constructor(reviewEntity) {
    // 1. Map các trường cơ bản
    this.id = reviewEntity.id;
    this.rating = reviewEntity.rating;
    this.comment = reviewEntity.comment;
    this.reviewType = reviewEntity.review_type;
    this.images = reviewEntity.images || []; // Đảm bảo luôn là mảng
    
    // 2. Format ngày tháng (Ví dụ: trả về timestamp hoặc ISO string sạch)
    this.createdAt = reviewEntity.created_at; 
    this.timeAgo = this.calculateTimeAgo(reviewEntity.created_at); // Tính toán thêm nếu thích

    // 3. Flatten (làm phẳng) thông tin User
    // Thay vì trả về object user lồng nhau, ta chỉ lấy những gì cần thiết
    if (reviewEntity.user) {
      this.authorName = reviewEntity.user.username;
      this.authorAvatar = reviewEntity.user.avatar_url;
      this.authorRole = reviewEntity.user.role; // Để frontend biết có phải admin hay resident
    } else {
      this.authorName = "Người dùng ẩn danh";
      this.authorAvatar = null;
    }
  }

  // Hàm phụ trợ: Tính thời gian tương đối (VD: "2 giờ trước")
  // Bạn có thể bỏ qua nếu muốn Frontend tự xử lý
  calculateTimeAgo(date) {
    const now = new Date();
    const posted = new Date(date);
    const diff = Math.abs(now - posted);
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return posted.toLocaleDateString('vi-VN');
  }
}

module.exports = ReviewModel;