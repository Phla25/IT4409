// backend/controllers/auth.controller.js
const db = require('../config/db.config.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // ✅ [MỚI]

// --- ĐĂNG KÝ (Giữ nguyên logic cũ, chỉ paste đè hàm Login) ---
exports.register = async (req, res) => { /* ...code cũ của bạn... */ };

// --- ĐĂNG NHẬP (USER) ---
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
    if (user.role !== 'user') return res.status(403).json({ message: "Vui lòng dùng cổng Admin." });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
    
    // ✅ [MỚI] TẠO SESSION ID & LƯU VÀO DB
    const currentSessionId = crypto.randomBytes(16).toString('hex');
    await db.query('UPDATE Users SET session_id = $1 WHERE id = $2', [currentSessionId, user.id]);

    // ✅ [MỚI] NHÉT SESSION ID VÀO TOKEN
    const token = jwt.sign(
        { id: user.id, role: user.role, session_id: currentSessionId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } 
    );

    const { password_hash, session_id, ...userInfo } = user;
    
    res.status(200).json({ success: true, token, user: userInfo, role: user.role });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// --- ĐĂNG NHẬP (ADMIN) ---
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin || admin.role !== 'admin') return res.status(401).json({ message: "Sai thông tin." });

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Sai thông tin." });

    // ✅ [MỚI] SESSION ADMIN
    const currentSessionId = crypto.randomBytes(16).toString('hex');
    await db.query('UPDATE Users SET session_id = $1 WHERE id = $2', [currentSessionId, admin.id]);

    const token = jwt.sign(
      { id: admin.id, role: 'admin', session_id: currentSessionId },
      process.env.JWT_SECRET,
      { expiresIn: '12h' } 
    );

    const { password_hash, session_id, ...adminInfo } = admin;
    res.status(200).json({ success: true, token, user: adminInfo, role: 'admin' });

  } catch (error) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

exports.logout = async (req, res) => {
    res.status(200).json({ success: true, message: "Đăng xuất thành công." });
};