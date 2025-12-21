const axios = require('axios');

// Hàm lấy thông tin thời tiết từ tọa độ
exports.getCurrentWeather = async (lat, lng) => {
  try {
    // Lưu ý: Open-Meteo sử dụng hệ thống lưới (Grid) 11km. 
    // Tọa độ trả về sẽ là tâm của ô lưới gần nhất, nên có thể lệch so với input.
    // Điều này KHÔNG ảnh hưởng đến độ chính xác của nhiệt độ/thời tiết trong khu vực thành phố.
    
    const url = 'https://api.open-meteo.com/v1/forecast';
    const response = await axios.get(url, {
      params: {
        latitude: lat,
        longitude: lng,
        current_weather: true,
        timezone: 'auto' // Tự động lấy múi giờ (Asia/Bangkok)
      },
      timeout: 5000 // Timeout sau 5s để tránh treo server
    });
    
    if (response.data && response.data.current_weather) {
      return response.data.current_weather;
    }
    return null;
  } catch (error) {
    // Chỉ warn nhẹ, không throw error để app vẫn chạy được bằng logic mặc định
    console.warn("⚠️ Weather API Warning:", error.message);
    return null;
  }
};

// Hàm Logic: Thời tiết này thì tìm CATEGORY gì?
// Dữ liệu dựa trên file categories.csv của bạn:
// Pho, Bun cha, Bun oc, Ca phe, Xoi, Banh mi, Quan an, Nha hang, Quan ca phe
exports.getCategoryKeywords = (weatherData) => {
  // 1. Mặc định (Fallback): Món ăn quốc dân ăn lúc nào cũng được
  const defaultKeywords = ['Pho', 'Bun cha', 'Banh mi', 'Com'];

  if (!weatherData) return defaultKeywords;

  const { temperature, weathercode } = weatherData;
  let keywords = [];

  // --- LOGIC THEO NHIỆT ĐỘ ---
  
  if (temperature < 19) {
    // ❄️ Trời Lạnh (< 19°C):
    // Ưu tiên: Món nước nóng hổi (Phở, Bún ốc), Món chắc bụng nóng (Xôi)
    // Địa điểm: Trong nhà ấm cúng (Nhà hàng, Quán ăn)
    keywords.push('Pho', 'Bun oc', 'Xoi', 'Nha hang', 'Quan an');
  } 
  else if (temperature >= 19 && temperature < 29) {
    // 🍃 Trời Mát (19-29°C):
    // Thời tiết đẹp, món gì cũng ngon. Ưu tiên đặc sản Hà Nội.
    keywords.push('Pho', 'Bun cha', 'Banh mi', 'Xoi', 'Ca phe');
  } 
  else {
    // ☀️ Trời Nóng (> 29°C):
    // Ưu tiên: Giải khát (Cà phê), Món nguội/chấm (Bún chả), Món khô (Bánh mì)
    // Tránh: Xôi, Bún ốc (vì nóng)
    keywords.push('Ca phe', 'Quan ca phe', 'Bun cha', 'Banh mi');
  }

  // --- LOGIC THEO ĐIỀU KIỆN (Mưa/Nắng) ---
  // Mã WMO: 
  // 51-67: Mưa phùn, Mưa rào
  // 80-82: Mưa lớn
  // 95-99: Dông bão
  const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
  
  if (rainCodes.includes(weathercode)) {
    // 🌧️ Trời Mưa:
    // Ưu tiên tuyệt đối không gian có mái che (Nhà hàng, Quán ăn)
    // Món nước nóng để ấm người (Phở, Bún ốc)
    // Loại bỏ các món vỉa hè hoặc cầm tay (Banh mi - tùy quán nhưng ăn vỉa hè mưa rất cực)
    keywords = ['Nha hang', 'Quan an', 'Pho', 'Bun oc']; 
  }

  // Nếu logic trên không tìm ra keyword nào (hiếm), dùng mặc định
  if (keywords.length === 0) return defaultKeywords;

  // Loại bỏ trùng lặp (Set) và trả về mảng
  return [...new Set(keywords)];
};