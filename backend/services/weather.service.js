const axios = require('axios');

// Hàm lấy thông tin thời tiết từ tọa độ
exports.getCurrentWeather = async (lat, lng) => {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast';
    const response = await axios.get(url, {
      params: {
        latitude: lat,
        longitude: lng,
        current_weather: true,
        timezone: 'auto'
      },
      timeout: 5000 
    });
    
    if (response.data && response.data.current_weather) {
      return response.data.current_weather;
    }
    return null;
  } catch (error) {
    console.warn("⚠️ Weather API Warning:", error.message);
    return null;
  }
};

// Hàm Logic: Thời tiết này thì tìm MÓN gì? (Dựa trên data thực tế từ file CSV)
exports.getCategoryKeywords = (weatherData) => {
  // Món ăn "quốc dân" (Fallback) - Luôn hiển thị nếu không biết gợi ý gì
  // Dựa trên các món ID 18, 26, 27, 40 trong file CSV
  const defaultKeywords = ['Phở', 'Cơm', 'Bún', 'Bánh mì'];

  if (!weatherData) return defaultKeywords;

  const { temperature, weathercode } = weatherData;
  let keywords = [];

  // --- 1. LOGIC THEO NHIỆT ĐỘ ---
  
  if (temperature < 20) {
    // ❄️ Trời Lạnh (< 20°C):
    // Ưu tiên món nóng, nước, nướng, lẩu
    // Từ file CSV: Lẩu nấm (8), Lẩu cá kèo (13), Dê nướng (17), Phở (18,19), Cháo (30-32), Bò sốt vang (66)
    keywords.push(
        'Lẩu', 'Nướng', 'Cháo', 'Súp', 'Bò Sốt Vang', 
        'Phở', 'Bún riêu', 'Bún Thang', 'Bánh canh', 
        'Vịt quay', 'Beefsteak', 'Cơm cháy', 'bánh đúc',
        'Canh nấm'
    );
  } 
  else if (temperature >= 20 && temperature < 30) {
    // 🍃 Trời Mát (20-29°C):
    // Thời tiết đẹp, ăn gì cũng ngon. Ưu tiên món đặc sản, món cuốn, món trộn.
    // Từ file CSV: Bún chả (5,6), Bún đậu (1), Nem (9,61), Phở cuốn (59), Cơm gà (2,28)
    keywords.push(
        'Bún chả', 'Bún đậu', 'Nem', 'Phở cuốn', 'Bánh mì', 
        'Cơm tấm', 'Cơm gà', 'Mì Quảng', 'Pizza', 'Burger',
        'Nộm', 'Gỏi', 'Bánh đúc', 'Cơm Trộn', 'Mì Tương Đen', 'xôi'
    );
  } 
  else {
    // ☀️ Trời Nóng (> 30°C):
    // Ưu tiên món mát, giải nhiệt, món cuốn, salad.
    // Từ file CSV: Kem (38,39), Chè (25), Trà (45,46,49), Sushi (56), Mì Lạnh (73)
    keywords.push(
        'Kem', 'Chè', 'Trà', 'Freeze', 'Sushi', 'Sashimi', 
        'Phở cuốn', 'Nộm', 'Salad', 'Mì Lạnh', 
        'Bia', 'Cafe', 'Bạc xỉu', 'Ôlong'
    );
  }

  // --- 2. LOGIC THEO ĐIỀU KIỆN MƯA/NẮNG ---
  // Mã WMO: 51-67 (Mưa nhỏ/vừa), 80-82 (Mưa lớn), 95-99 (Dông bão)
  const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
  
  if (rainCodes.includes(weathercode)) {
    // 🌧️ Trời Mưa:
    // Ưu tiên món nước nóng hổi, món ship về nhà tiện lợi (Pizza, Gà rán)
    // Từ file CSV: Pizza (4,50,52), Gà quay (55), Cháo (30), Phở (26)
    keywords.push(
        'Cháo', 'Súp', 'Phở', 'Mì', 'Lẩu', 
        'Pizza', 'Gà quay', 'Cơm rang', 'Bò Sốt Vang'
    );
    // Loại bỏ các món lạnh/kem khi trời mưa
    keywords = keywords.filter(k => !['Kem', 'Chè', 'Bia', 'Freeze', 'Mì Lạnh'].includes(k));
  }

  if (keywords.length === 0) return defaultKeywords;

  // Loại bỏ trùng lặp
  return [...new Set(keywords)];
};