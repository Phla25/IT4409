// backend/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

// Middleware 1: Xác thực Token
exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; 
    if (!token) return res.status(401).json({ message: 'Truy cập bị từ chối. Không có token.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Gắn thông tin người dùng (id, role) vào req.user
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token không hợp lệ.' });
    }
};

// Middleware 2: Phân quyền Admin
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Truy cập bị từ chối. Bạn không có quyền Admin.' });
    }
};