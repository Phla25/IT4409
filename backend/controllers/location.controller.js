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

        // 2. 👇 SỬA ĐOẠN NÀY: Thêm "id," vào câu lệnh SELECT
        // Và nhớ dùng tên bảng "locationimages" (viết thường) cho khớp với DB của bạn
        const imageSql = `
            SELECT id, image_url as url, description, is_main, uploaded_at 
            FROM locationimages 
            WHERE location_id = $1 
            ORDER BY is_main DESC, uploaded_at DESC
        `;
        const imagesResult = await db.query(imageSql, [locationId]);
        
        // Gán vào object trả về
        location.images = imagesResult.rows; // Đổi tên field thành images cho khớp Frontend mới

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
// 👇 HÀM DEBUG CHI TIẾT (Thay thế hàm cũ)
exports.addImagesToLocation = async (req, res) => {
    const { id } = req.params;
    console.log(`\n🔍 [DEBUG] Bắt đầu upload ảnh cho Location ID: ${id}`);

    // 1. KIỂM TRA BIẾN DB
    if (!db || typeof db.query !== 'function') {
        console.error("❌ LỖI CONFIG: Biến 'db' không có hàm query(). Kiểm tra file db.config.js!");
        // Nếu db sai, trả lỗi ngay
        return res.status(500).json({ 
            message: "Lỗi cấu hình Database Backend", 
            detail: "db.query is not a function. Check db.config.js exports." 
        });
    }

    try {
        // 2. KIỂM TRA FILE GỬI LÊN
        const files = req.files || [];
        console.log(`📂 Số lượng file nhận được: ${files.length}`);
        
        if (files.length === 0) {
            return res.status(400).json({ message: "Chưa chọn ảnh nào (req.files rỗng)!" });
        }
        
        // Log thử file đầu tiên xem cấu trúc
        console.log("📝 Info file đầu tiên:", JSON.stringify(files[0], null, 2));

        // 3. KIỂM TRA KẾT NỐI DB & TỒN TẠI BẢNG
        // Thử query nhẹ 1 cái để xem DB sống không
        try {
            // Dùng tên bảng 'locationimages' (viết thường) như trong ảnh bạn gửi
            await db.query('SELECT 1 FROM locationimages LIMIT 1'); 
            console.log("✅ Kết nối DB OK. Bảng 'locationimages' tồn tại.");
        } catch (dbErr) {
            console.error("❌ Lỗi kết nối DB hoặc không tìm thấy bảng:", dbErr.message);
            // Thử fallback sang tên bảng có ngoặc kép nếu bảng thường không thấy
            try {
                console.log("⚠️ Thử tìm bảng \"LocationImages\" (có ngoặc kép)...");
                await db.query('SELECT 1 FROM "LocationImages" LIMIT 1');
                console.log("✅ Tìm thấy bảng \"LocationImages\"!");
            } catch (e2) {
                throw new Error(`Không tìm thấy bảng ảnh nào cả! Lỗi gốc: ${dbErr.message}`);
            }
        }

        // 4. KIỂM TRA ĐỊA ĐIỂM CÓ TỒN TẠI KHÔNG
        // Dùng bảng 'locations' (viết thường) hoặc 'Locations'
        const checkLoc = await db.query(`SELECT id FROM locations WHERE id = $1`, [id]);
        if (checkLoc.rows.length === 0) {
            console.error(`❌ Không tìm thấy địa điểm ID ${id}`);
            return res.status(404).json({ message: `Địa điểm ID ${id} không tồn tại.` });
        }

        // 5. KIỂM TRA ẢNH BÌA
        const checkMain = await db.query(
            `SELECT id FROM locationimages WHERE location_id = $1 AND is_main = true`, 
            [id]
        );
        let needMain = (checkMain.rows.length === 0);

        // 6. THỰC HIỆN LƯU VÀO DB
        let successCount = 0;
        for (const file of files) {
            const isMain = needMain;
            if (needMain) needMain = false; // Chỉ cái đầu tiên làm main

            // Lấy link ảnh (Cloudinary trả về path hoặc secure_url)
            const imageUrl = file.path || file.secure_url;
            
            if (!imageUrl) {
                console.warn("⚠️ File không có đường dẫn ảnh, bỏ qua:", file);
                continue;
            }

            console.log(`💾 Đang lưu vào DB: ${imageUrl} (Main: ${isMain})`);

            // INSERT vào bảng locationimages (viết thường)
            await db.query(
                `INSERT INTO locationimages (location_id, image_url, description, is_main, uploaded_at) 
                 VALUES ($1, $2, $3, $4, NOW())`,
                [id, imageUrl, 'Ảnh thêm mới', isMain]
            );
            successCount++;
        }

        console.log(`🎉 [THÀNH CÔNG] Đã lưu ${successCount} ảnh.`);
        res.status(200).json({ success: true, message: `Đã thêm ${successCount} ảnh thành công.` });

    } catch (error) {
        // IN LỖI CHI TIẾT RA TERMINAL
        console.error("🔥 LỖI SERVER CRITICAL:", error);
        
        // Trả về Frontend để bạn đọc được lỗi
        res.status(500).json({ 
            message: "Lỗi Server khi xử lý ảnh", 
            error_name: error.name,
            error_message: error.message,
            error_stack: error.stack
        });
    }
};
// [ADMIN] Xóa 1 ảnh cụ thể
exports.deleteLocationImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        // Xóa khỏi Database (Dùng tên bảng viết thường 'locationimages')
        const result = await db.query('DELETE FROM locationimages WHERE id = $1 RETURNING id', [imageId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Ảnh không tồn tại." });
        }
        res.status(200).json({ success: true, message: "Đã xóa ảnh thành công." });
    } catch (error) {
        console.error("Delete Image Error:", error);
        res.status(500).json({ message: "Lỗi server khi xóa ảnh." });
    }
};
// 👇 BỔ SUNG HÀM NÀY (Đang bị thiếu gây lỗi server)
exports.batchCreateLocations = async (req, res) => {
    try {
        const { locations } = req.body;
        if (!Array.isArray(locations)) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ (phải là mảng)." });
        }

        let savedCount = 0;
        for (const loc of locations) {
            // Tạo từng địa điểm từ file Excel
            await Location.create({
                ...loc,
                created_by_user_id: req.user.id,
                is_approved: true, // Import Excel thường là Admin nên duyệt luôn
                created_at: new Date()
            });
            savedCount++;
        }

        res.status(200).json({ success: true, message: `Đã import thành công ${savedCount} địa điểm!` });
    } catch (error) {
        console.error("Batch Create Error:", error);
        res.status(500).json({ message: "Lỗi khi import dữ liệu." });
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