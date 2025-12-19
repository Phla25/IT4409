const Location = require('../models/location.model');
// 👇 Import thêm WeatherService và DB để dùng cho tính năng gợi ý
const WeatherService = require('../services/weather.service');
const db = require('../config/db.config');

// [PUBLIC] Lấy tất cả địa điểm (Thường dùng cho hiển thị Map ban đầu)
exports.getAllLocations = async (req, res) => {
  try {
    // Chỉ lấy các địa điểm ĐÃ ĐƯỢC DUYỆT (is_approved = true) cho public API
    const locations = await Location.getAllLocationsForMap(); 
    
    // Giả sử Model trả về hết, ta lọc ở đây để an toàn nếu là guest
    const visibleLocations = locations.filter(loc => loc.is_approved);

    res.status(200).json({ 
        success: true, 
        count: visibleLocations.length, 
        data: visibleLocations 
    });
  } catch (error) {
    console.error("Error getAllLocations:", error);
    res.status(500).json({ message: "Lỗi server khi tải dữ liệu bản đồ." });
  }
};

// [PUBLIC] Gợi ý địa điểm gần người dùng (Tìm kiếm theo bán kính)
exports.getNearbyLocations = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query; 

    // 1. Validate Input
    if (!lat || !lng) {
        return res.status(400).json({ message: "Yêu cầu cung cấp tọa độ (lat, lng)." });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadiusKm = parseFloat(radius) || 5.0; // Mặc định 5km nếu không gửi lên

    if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({ message: "Tọa độ không hợp lệ." });
    }

    // 2. Gọi Model xử lý (Model cần sử dụng công thức Haversine hoặc PostGIS)
    const locations = await Location.getNearby(userLat, userLng, searchRadiusKm);

    // 3. Lọc chỉ lấy địa điểm đã duyệt (Nếu Model chưa lọc)
    const approvedLocations = locations.filter(loc => loc.is_approved);

    res.status(200).json({ 
        success: true, 
        count: approvedLocations.length, 
        radius_km: searchRadiusKm,
        data: approvedLocations 
    });

  } catch (error) {
    console.error("Lỗi tìm kiếm gần đây:", error);
    res.status(500).json({ message: "Lỗi server khi tìm địa điểm gần bạn." });
  }
};

// [ADMIN] Lấy tất cả địa điểm (Bao gồm cả chưa duyệt)
exports.getAllLocationsForAdmin = async (req, res) => {
    try {
        const locations = await Location.getAllForAdmin(); 
        
        res.status(200).json({ 
            success: true, 
            count: locations.length, 
            data: locations 
        });
    } catch (error) {
        console.error("Admin get all error:", error);
        res.status(500).json({ message: "Lỗi server khi lấy danh sách quản trị." });
    }
};

// [USER/ADMIN] Xem chi tiết 1 địa điểm
exports.getLocationById = async (req, res) => {
    try {
        const locationId = req.params.id;

        if (!locationId || isNaN(parseInt(locationId, 10))) {
            return res.status(400).json({ message: "ID địa điểm không hợp lệ." });
        }

        const location = await Location.findById(locationId);

        if (!location) {
            return res.status(404).json({ message: "Địa điểm không tồn tại." });
        }

        // Logic phân quyền xem:
        const isAdmin = !!(req.user && req.user.role === 'admin');
        
        if (!isAdmin && !location.is_approved) {
             return res.status(404).json({ message: "Địa điểm này đang chờ duyệt hoặc không khả dụng." });
        }

        res.status(200).json({ success: true, data: location });
    } catch (error) {
        console.error("Get By ID error:", error);
        res.status(500).json({ message: "Lỗi server khi lấy thông tin địa điểm." });
    }
};

// [AUTH REQUIRED] Tạo địa điểm mới
exports.createLocation = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Vui lòng đăng nhập." });

        const isAutoApproved = req.user.role === 'admin';

        const newLocationData = {
            ...req.body,
            created_by_user_id: req.user.id,
            is_approved: isAutoApproved,
            created_at: new Date()
        };

        const newLocation = await Location.create(newLocationData);
        
        // 👇👇👇 SOCKET LOGIC BẮT ĐẦU TỪ ĐÂY 👇👇👇
        if (!isAutoApproved) {
            const io = req.app.get("socketio"); // Lấy biến io đã set ở server.js
            if (io) {
                // Gửi sự kiện 'new_proposal' tới tất cả người trong phòng 'admin_room'
                io.to("admin_room").emit("new_proposal", {
                    message: `📢 Có địa điểm mới chờ duyệt: ${newLocationData.name}`,
                    data: newLocation
                });
                console.log("Socket sent: new_proposal");
            }
        }
        // 👆👆👆 KẾT THÚC SOCKET LOGIC 👆👆👆

        res.status(201).json({ 
            success: true, 
            message: isAutoApproved ? "Đã tạo địa điểm mới." : "Cảm ơn bạn! Địa điểm đang chờ Admin duyệt.",
            data: newLocation 
        });
    } catch (error) {
        console.error("Create Error:", error);
        res.status(500).json({ message: "Lỗi server." });
    }
};

// [ADMIN] Cập nhật địa điểm
exports.updateLocation = async (req, res) => {
    try {
        const updatedLocation = await Location.update(req.params.id, req.body);
        
        if (!updatedLocation) {
            return res.status(404).json({ message: "Không tìm thấy địa điểm để cập nhật." });
        }
        
        // 👇👇👇 THÊM SOCKET: Báo cho Admin cập nhật lại số lượng 👇👇👇
        const io = req.app.get("socketio");
        if (io) {
            io.to("admin_room").emit("refresh_pending_count"); 
        }
        // 👆👆👆
        
        res.status(200).json({ success: true, message: "Cập nhật thành công.", data: updatedLocation });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật." });
    }
};

// [ADMIN] Xóa địa điểm
exports.deleteLocation = async (req, res) => {
    try {
        const deleted = await Location.delete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy địa điểm để xóa." });
        
        // 👇👇👇 THÊM SOCKET: Xóa xong cũng phải cập nhật lại số 👇👇👇
        const io = req.app.get("socketio");
        if (io) {
            io.to("admin_room").emit("refresh_pending_count");
        }
        // 👆👆👆
        
        res.status(200).json({ success: true, message: "Đã xóa địa điểm thành công." });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Lỗi server khi xóa." });
    }
};

exports.batchCreateLocations = async (req, res) => {
  try {
    res.status(200).json({ message: "Batch create working" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

exports.searchLocations = async (req, res) => {
  try {
    const { keyword } = req.query; 

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm" });
    }

    const locations = await Location.search(keyword);
    
    return res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    console.error("Search Error:", error);
    return res.status(500).json({ message: "Lỗi khi tìm kiếm địa điểm" });
  }
};

// [ADMIN] Lấy số lượng chờ duyệt
exports.getPendingCount = async (req, res) => {
  try {
    const count = await Location.countPending();
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Count pending error:", error);
    res.status(500).json({ message: "Lỗi đếm số lượng." });
  }
};

// 🔥 [PUBLIC] Gợi ý MÓN ĂN theo thời tiết (Sử dụng WeatherService)
exports.getDishRecommendations = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Cần tọa độ để lấy thời tiết." });
    }

    // 1. Gọi Service lấy dữ liệu thời tiết
    const weather = await WeatherService.getCurrentWeather(lat, lng);
    
    // 2. Gọi Service lấy danh sách Category phù hợp (Dựa trên CSV Categories)
    const categoryKeywords = WeatherService.getCategoryKeywords(weather);

    // 3. Query Database phức hợp để tìm món ăn
    // Tìm món ăn mà (Category của Món đó OR Category của Quán đó) trùng với từ khóa
    const sql = `
      SELECT DISTINCT
        m.id, 
        COALESCE(m.custom_name, bd.name) as dish_name, 
        m.price, 
        (SELECT image_url FROM menuitemimages WHERE menu_item_id = m.id LIMIT 1) as dish_image,
        l.id as location_id, 
        l.name as restaurant_name, 
        l.address
      FROM menuitems m
      JOIN locations l ON m.location_id = l.id
      JOIN basedishes bd ON m.base_dish_id = bd.id
      
      -- Join để check Category của Món ăn (Base Dish)
      LEFT JOIN basedishcategories bdc ON bd.id = bdc.base_dish_id
      LEFT JOIN categories c_dish ON bdc.category_id = c_dish.id
      
      -- Join để check Category của Quán (Location)
      LEFT JOIN locationcategories lc ON l.id = lc.location_id
      LEFT JOIN categories c_loc ON lc.category_id = c_loc.id

      WHERE l.is_approved = true
      AND (
        c_dish.name ILIKE ANY($1) 
        OR 
        c_loc.name ILIKE ANY($1)
      )
      ORDER BY RANDOM()
      LIMIT 8
    `;

    // Chuyển mảng keyword thành dạng params cho ANY: ['%Pho%', '%Bun cha%', ...]
    const params = [categoryKeywords.map(kw => `%${kw}%`)];
    
    const result = await db.query(sql, params);

    res.json({
      success: true,
      weather: {
        temp: weather?.temperature,
        condition_code: weather?.weathercode,
        keywords: categoryKeywords
      },
      data: result.rows
    });

  } catch (error) {
    console.error("Dish Recommendation Error:", error);
    res.status(500).json({ message: "Lỗi khi lấy gợi ý món ăn." });
  }
};