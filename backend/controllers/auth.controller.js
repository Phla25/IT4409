// backend/controllers/auth.controller.js
const db = require('../config/db.config.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username)
    return res.status(400).json({ message: "Thiếu thông tin." });

  try {
    const emailNormalized = email.toLowerCase().trim();

    // 🔍 Kiểm tra email tồn tại chưa
    const check = await db.query('SELECT id, email FROM Users WHERE LOWER(email) = LOWER($1)', [emailNormalized]);
    console.log('Check email:', emailNormalized, '=>', check.rows);

    if (check.rows.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const sql = `
      INSERT INTO Users (email, password_hash, username, role)
      VALUES ($1, $2, $3, 'user')
      RETURNING id, username, email, role;
    `;
    const result = await db.query(sql, [emailNormalized, password_hash, username]);

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Register error:', error);
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

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Kiểm tra tài khoản có role = 'admin'
    const userResult = await db.query(
      'SELECT * FROM Users WHERE email = $1 AND role = $2',
      [email, 'admin']
    );
    const admin = userResult.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(400).json({ message: "Tài khoản hoặc mật khẩu admin không đúng." });
    }

    console.log('JWT_SECRET at login:', process.env.JWT_SECRET);

    const token = jwt.sign(
      { id: admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      role: 'admin',
      username: admin.username
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi đăng nhập admin." });
  }
};
