// backend/controllers/auth.controller.js
const db = require('../config/db.config.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) return res.status(400).json({ message: "Thiếu thông tin." });
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const sql = `INSERT INTO Users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, username, email, role;`;
    const result = await db.query(sql, [email, password_hash, username]);
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: "Email đã tồn tại." });
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi đăng ký." });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng." });
    }
    
    // Tạo JWT
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ success: true, token, role: user.role, username: user.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
};