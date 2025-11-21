// backend/controllers/auth.controller.js
const db = require('../config/db.config.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- ĐĂNG KÝ ---
exports.register = async (req, res) => {
  const { email, password, username } = req.body;
  
  // Validate cơ bản
  if (!email || !password || !username) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin (email, password, username)." });
  }

  try {
    const emailNormalized = email.toLowerCase().trim();

    // 1. Kiểm tra email tồn tại
    const check = await db.query('SELECT id FROM Users WHERE LOWER(email) = $1', [emailNormalized]);
    if (check.rows.length > 0) {
      return res.status(409).json({ message: "Email này đã được sử dụng." });
    }

    // 2. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Tạo User mới (Mặc định role là 'user')
    const sql = `
      INSERT INTO Users (email, password_hash, username, role, is_active)
      VALUES ($1, $2, $3, 'user', true)
      RETURNING id, username, email, role, created_at;
    `;
    const result = await db.query(sql, [emailNormalized, password_hash, username]);

    const newUser = result.rows[0];

    // Tùy chọn: Có thể tạo luôn Token để user đăng nhập ngay sau khi đăng ký
    // const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ 
      success: true, 
      message: "Đăng ký thành công!", 
      user: newUser 
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: "Lỗi hệ thống khi đăng ký." });
  }
};

// --- ĐĂNG NHẬP (USER THƯỜNG) ---
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Tìm user
    const userResult = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    // 2. Kiểm tra user tồn tại
    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
    }

    // 3. Kiểm tra quyền (Chặn Admin đăng nhập ở cổng User nếu muốn tách biệt)
    if (user.role !== 'user') {
      return res.status(403).json({ 
        message: "Tài khoản này là Admin. Vui lòng sử dụng trang đăng nhập dành cho quản trị viên." 
      });
    }

    // 4. Kiểm tra trạng thái hoạt động (Optional)
    if (!user.is_active) {
        return res.status(403).json({ message: "Tài khoản này đã bị khóa." });
    }

    // 5. Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
    }
    
    // 6. Tạo Token
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }); // Token sống 7 ngày

    // 7. Trả về kết quả (Loại bỏ password hash)
    const { password_hash, ...userInfo } = user;
    
    res.status(200).json({ 
      success: true, 
      message: "Đăng nhập thành công.",
      token, 
      user: userInfo 
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
};

// --- ĐĂNG NHẬP (ADMIN) ---
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Tìm Admin
    const userResult = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
    const admin = userResult.rows[0];

    // 2. Validate Admin & Password
    if (!admin || admin.role !== 'admin') {
        // Trả về lỗi chung chung để bảo mật
        return res.status(401).json({ message: "Thông tin đăng nhập không chính xác hoặc bạn không có quyền Admin." });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Thông tin đăng nhập không chính xác." });
    }

    // 3. Tạo Token Admin
    const token = jwt.sign(
      { id: admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Admin token ngắn hạn hơn để bảo mật
    );

    const { password_hash, ...adminInfo } = admin;

    res.status(200).json({
      success: true,
      message: "Chào mừng quản trị viên quay trở lại.",
      token,
      user: adminInfo
    });

  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: "Lỗi server khi đăng nhập Admin." });
  }
};

// --- ĐĂNG XUẤT (LOGOUT) ---
exports.logout = async (req, res) => {
    try {
        // Với JWT stateless, server không thực sự "xóa" session.
        // Hành động này chủ yếu để Client xóa token ở localStorage/Cookie.
        // Nếu dùng Cookie httpOnly, ta sẽ clear cookie tại đây.
        
        // res.clearCookie('token'); // Nếu bạn dùng cookie
        
        res.status(200).json({ 
            success: true, 
            message: "Đăng xuất thành công. Vui lòng xóa token ở phía Client." 
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi đăng xuất." });
    }
};