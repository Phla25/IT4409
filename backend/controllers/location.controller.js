// backend/controllers/location.controller.js
const Location = require('../models/location.model');
const WeatherService = require('../services/weather.service');
const db = require('../config/db.config');

// [PUBLIC] Lấy tất cả địa điểm
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.getAllLocationsForMap(); 
    const visibleLocations = locations.filter(loc => loc.is_approved);
    res.status(200).json({ success: true, count: visibleLocations.length, data: visibleLocations });
  } catch (error) {
    console.error("Error getAllLocations:", error);
    res.status(500).json({ message: "Lỗi server khi tải dữ liệu bản đồ." });
  }
};

// [PUBLIC] Gợi ý địa điểm gần người dùng
exports.getNearbyLocations = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query; 
    if (!lat || !lng) return res.status(400).json({ message: "Thiếu tọa độ." });

    const searchRadiusKm = parseFloat(radius) || 5.0;
    const locations = await Location.getNearby(parseFloat(lat), parseFloat(lng), searchRadiusKm);
    const approvedLocations = locations.filter(loc => loc.is_approved);

    res.status(200).json({ success: true, count: approvedLocations.length, data: approvedLocations });
  } catch (error) {
    console.error("Lỗi tìm kiếm gần đây:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// [ADMIN] Lấy tất cả
exports.getAllLocationsForAdmin = async (req, res) => {
    try {
        const locations = await Location.getAllForAdmin(); 
        res.status(200).json({ success: true, count: locations.length, data: locations });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server." });
    }
};

// [USER/ADMIN] Xem chi tiết 1 địa điểm (KÈM ẢNH GALLERY)
exports.getLocationById = async (req, res) => {
    try {
        const locationId = req.params.id;
        
        // 1. Lấy thông tin cơ bản
        const location = await Location.findById(locationId);
        if (!location) return res.status(404).json({ message: "Địa điểm không tồn tại." });

        const isAdmin = !!(req.user && req.user.role === 'admin');
        if (!isAdmin && !location.is_approved) {
             return res.status(404).json({ message: "Địa điểm chưa được duyệt." });
        }

        // 2. 👇 LẤY THÊM DANH SÁCH ẢNH TỪ BẢNG LocationImages
        const imageSql = `
            SELECT image_url as url, description, is_main, uploaded_at 
            FROM LocationImages 
            WHERE location_id = $1 
            ORDER BY is_main DESC, uploaded_at DESC
        `;
        const imagesResult = await db.query(imageSql, [locationId]);
        
        // Gán vào object trả về
        location.gallery = imagesResult.rows; 

        res.status(200).json({ success: true, data: location });
    } catch (error) {
        console.error("Get By ID error:", error);
        res.status(500).json({ message: "Lỗi server." });
    }
};

// [AUTH REQUIRED] Tạo địa điểm mới (CÓ XỬ LÝ ẢNH)
exports.createLocation = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Vui lòng đăng nhập." });

        const isAutoApproved = req.user.role === 'admin';
        // Lấy danh sách file từ Multer (nếu có)
        const files = req.files || [];

        const newLocationData = {
            ...req.body,
            created_by_user_id: req.user.id,
            is_approved: isAutoApproved,
            created_at: new Date()
        };

        // 1. Tạo Location (Bảng cha)
        const newLocation = await Location.create(newLocationData);
        
        // 2. 👇 LƯU ẢNH VÀO BẢNG CON (LocationImages)
        if (files.length > 0 && newLocation && newLocation.id) {
            for (let i = 0; i < files.length; i++) {
                // Ảnh đầu tiên là ảnh bìa (is_main = true)
                const isMain = (i === 0);
                await db.query(
                    `INSERT INTO LocationImages (location_id, image_url, description, is_main, uploaded_at) 
                     VALUES ($1, $2, $3, $4, NOW())`,
                    [newLocation.id, files[i].path, 'Ảnh gốc', isMain]
                );
            }
        }

        // 3. Socket thông báo (Giữ nguyên logic cũ của bạn)
        if (!isAutoApproved) {
            const io = req.app.get("socketio");
            if (io) {
                io.to("admin_room").emit("new_proposal", {
                    message: `📢 Mới: ${newLocationData.name}`,
                    data: newLocation
                });
            }
        }

        res.status(201).json({ 
            success: true, 
            message: "Tạo thành công!",
            data: newLocation 
        });
    } catch (error) {
        console.error("Create Error:", error);
        res.status(500).json({ message: "Lỗi server." });
    }
};

// 👇 [API MỚI] Thêm ảnh vào địa điểm có sẵn
exports.addImagesToLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files || [];

        if (files.length === 0) return res.status(400).json({ message: "Chưa chọn ảnh." });

        // Check xem đã có ảnh bìa chưa
        const checkMain = await db.query(`SELECT id FROM LocationImages WHERE location_id = $1 AND is_main = true`, [id]);
        let needMain = (checkMain.rows.length === 0);

        for (let i = 0; i < files.length; i++) {
            const isMain = (needMain && i === 0);
            await db.query(
                `INSERT INTO LocationImages (location_id, image_url, description, is_main, uploaded_at) 
                 VALUES ($1, $2, $3, $4, NOW())`,
                [id, files[i].path, `Ảnh thêm mới`, isMain]
            );
        }

        res.status(200).json({ success: true, message: `Đã thêm ${files.length} ảnh.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi thêm ảnh." });
    }
};

// [ADMIN] Cập nhật
exports.updateLocation = async (req, res) => {
    try {
        const updatedLocation = await Location.update(req.params.id, req.body);
        if (!updatedLocation) return res.status(404).json({ message: "Không tìm thấy." });
        
        const io = req.app.get("socketio");
        if (io) io.to("admin_room").emit("refresh_pending_count"); 
        
        res.status(200).json({ success: true, message: "Cập nhật thành công.", data: updatedLocation });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server." });
    }
};

// [ADMIN] Xóa
exports.deleteLocation = async (req, res) => {
    try {
        const deleted = await Location.delete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy." });
        
        const io = req.app.get("socketio");
        if (io) io.to("admin_room").emit("refresh_pending_count");
        
        res.status(200).json({ success: true, message: "Đã xóa." });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server." });
    }
};

// Các hàm phụ khác (Search, Count, Batch...) giữ nguyên như cũ
exports.searchLocations = async (req, res) => {
    /* ... Code cũ của bạn ... */
    try {
        const { keyword } = req.query; 
        if (!keyword) return res.status(400).json({ message: "Nhập từ khóa" });
        const locations = await Location.search(keyword);
        return res.status(200).json({ success: true, data: locations });
      } catch (error) {
        return res.status(500).json({ message: "Lỗi tìm kiếm" });
      }
};

exports.getPendingCount = async (req, res) => {
    /* ... Code cũ của bạn ... */
    try {
        const count = await Location.countPending();
        res.status(200).json({ success: true, count });
      } catch (error) {
        res.status(500).json({ message: "Lỗi đếm." });
      }
};

// DISH RECOMMENDATION (Code cũ của bạn, không đổi)
exports.getDishRecommendations = async (req, res) => {
    /* ... Giữ nguyên code cũ vì nó không liên quan đến upload ảnh ... */
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ message: "Cần tọa độ." });
    
        const weather = await WeatherService.getCurrentWeather(lat, lng);
        const categoryKeywords = WeatherService.getCategoryKeywords(weather);
    
        const sql = `
          SELECT * FROM (
            SELECT DISTINCT
              m.id, COALESCE(m.custom_name, bd.name) as dish_name, m.price, 
              (SELECT image_url FROM menuitemimages WHERE menu_item_id = m.id LIMIT 1) as dish_image,
              l.id as location_id, l.name as restaurant_name, l.address
            FROM menuitems m
            JOIN locations l ON m.location_id = l.id
            JOIN basedishes bd ON m.base_dish_id = bd.id
            LEFT JOIN basedishcategories bdc ON bd.id = bdc.base_dish_id
            LEFT JOIN categories c_dish ON bdc.category_id = c_dish.id
            LEFT JOIN locationcategories lc ON l.id = lc.location_id
            LEFT JOIN categories c_loc ON lc.category_id = c_loc.id
            WHERE l.is_approved = true
            AND (c_dish.name ILIKE ANY($1) OR c_loc.name ILIKE ANY($1))
          ) AS distinct_dishes
          ORDER BY RANDOM() LIMIT 8
        `;
        const params = [categoryKeywords.map(kw => `%${kw}%`)];
        const result = await db.query(sql, params);
    
        res.json({
          success: true,
          weather: { temp: weather?.temperature, condition_code: weather?.weathercode, keywords: categoryKeywords },
          data: result.rows
        });
      } catch (error) {
        console.error("Dish Rec Error:", error);
        res.status(500).json({ message: "Lỗi gợi ý món." });
      }
};