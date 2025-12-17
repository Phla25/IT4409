const reviewService = require("../services/review.service");

// Xử lý Request POST /api/reviews
exports.create = async (req, res) => {
  try {
    // Gọi Service để xử lý
    const result = await reviewService.createReview(req.body);
    
    return res.status(201).json({
      success: true,
      message: "Đánh giá đã được gửi thành công!",
      data: result
    });

  } catch (error) {
    // Xử lý các loại lỗi mà Service ném ra
    if (error.message === "FORBIDDEN_NOT_RESIDENT") {
      return res.status(403).json({ message: "Chỉ có Cư dân mới được phép thực hiện chức năng này!" });
    }
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    console.error(error);
    return res.status(500).json({ message: "Lỗi server nội bộ." });
  }
};

// Xử lý Request GET /api/reviews
exports.findAll = async (req, res) => {
  try {
    const { location_id } = req.query;
    
    if (!location_id) {
      return res.status(400).json({ message: "Thiếu location_id" });
    }

    const reviews = await reviewService.getReviewsByLocation(location_id);
    
    return res.status(200).json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi khi tải danh sách đánh giá." });
  }
};