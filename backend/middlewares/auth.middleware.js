// backend/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/db.config.js'); 
const rateLimit = require('express-rate-limit'); // ✅ [MỚI]

// 1. CHỐNG SPAM LOGIN (Sai 5 lần khóa 15 phút)
exports.loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: { message: "Bạn đã thử quá nhiều lần. Vui lòng quay lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 2. XÁC THỰC & CHECK SESSION
exports.verifyToken = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Vui lòng đăng nhập.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // ✅ [QUAN TRỌNG] So sánh Session ID
        const userQuery = await db.query('SELECT session_id, role FROM Users WHERE id = $1', [decoded.id]);
        const userInDb = userQuery.rows[0];

        if (!userInDb || userInDb.session_id !== decoded.session_id) {
            return res.status(401).json({ 
                message: 'Tài khoản đã đăng nhập ở nơi khác.',
                forceLogout: true 
            });
        }

        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token hết hạn hoặc lỗi.' });
    }
};

// 3. ADMIN CHECK
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') next();
    else res.status(403).json({ message: 'Chức năng chỉ dành cho Admin.' });
};

// 4. OPTIONAL AUTH (Đá luôn nếu Token cũ)
exports.verifyTokenOptional = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const q = await db.query('SELECT session_id FROM Users WHERE id = $1', [decoded.id]);
        
        // Nếu Token có nhưng Session sai -> Đá (401)
        if (q.rows[0] && q.rows[0].session_id !== decoded.session_id) {
             return res.status(401).json({ message: 'Login nơi khác.', forceLogout: true });
        }
        if (q.rows[0]) req.user = decoded;
        next();
    } catch (err) { next(); } // Lỗi token coi như khách
};