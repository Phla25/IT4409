// backend/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

// Middleware 1: Xác thực Token (Bắt buộc phải đăng nhập)
exports.verifyToken = (req, res, next) => {
    // Lấy token từ header: "Authorization: Bearer abcxyz..."
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện chức năng này.' });
    }

    try {
        // Giải mã token lấy từ env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lưu { id, role } vào req để dùng ở Controller
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

// Middleware 2: Chỉ cho phép Admin
exports.isAdmin = (req, res, next) => {
    // req.user đã có từ verifyToken chạy trước đó
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Truy cập bị từ chối. Chức năng này chỉ dành cho Quản trị viên.' });
    }
};
    // Dùng cho: Xem chi tiết địa điểm (Khách vẫn xem được, Admin xem được nhiều hơn)
exports.verifyTokenOptional = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    // Trường hợp 1: Không có token (Khách vãng lai)
    if (!token) {
        // Vẫn cho đi tiếp, nhưng req.user sẽ là undefined
        return next();
    }

    // Trường hợp 2: Có token (User hoặc Admin)
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lưu thông tin để Controller biết đây là ai
        next();
    } catch (err) {
        // Token lỗi/hết hạn -> Vẫn cho đi tiếp như khách vãng lai
        // (Hoặc bạn có thể chọn chặn lại tuỳ logic, ở đây ta cho qua để không ngắt trải nghiệm xem)
        console.warn("Token lỗi ở optional auth:", err.message);
        next();
    }
};