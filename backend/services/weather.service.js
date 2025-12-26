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

// Hàm Logic: Thời tiết này thì tìm MÓN gì? (Dựa trên data thực tế)
exports.getCategoryKeywords = (weatherData) => {
  // Món ăn "quốc dân" (Fallback)
  const defaultKeywords = ['Phở', 'Cơm', 'Bún', 'Bánh mì'];

  if (!weatherData) return defaultKeywords;

  const { temperature, weathercode } = weatherData;
  let keywords = [];

  // --- 1. LOGIC THEO NHIỆT ĐỘ ---
  
  if (temperature < 19) {
    // ❄️ Trời Lạnh (< 19°C):
    // Ưu tiên món nóng, nước, nướng, lẩu
    // Dựa trên data-1766736184959.csv:
    keywords.push(
        'Lẩu', 'Nướng', 'Cháo', 'Súp', 'Bò Sốt Vang', 
        'Phở', 'Bún riêu', 'Bún Thang', 'Bánh canh', 
        'Vịt quay', 'Beefsteak', 'Cơm cháy kho quẹt',
        'bánh đúc nóng'
    );
  } 
  else if (temperature >= 19 && temperature < 29) {
    // 🍃 Trời Mát (19-29°C):
    // Thời tiết đẹp, ăn gì cũng ngon. Ưu tiên món đặc sản, món cuốn, món trộn.
    keywords.push(
        'Bún chả', 'Bún đậu', 'Nem', 'Phở cuốn', 'Bánh mì', 
        'Cơm tấm', 'Cơm gà', 'Mì Quảng', 'Pizza', 'Burger',
        'Nộm', 'Gỏi', 'Bánh đúc', 'Cơm Trộn', 'Mì Tương Đen', 'xôi gà'
    );
  } 
  else {
    // ☀️ Trời Nóng (> 29°C):
    // Ưu tiên món mát, giải nhiệt, món cuốn, salad.
    keywords.push(
        'Kem', 'Chè', 'Trà', 'Freeze', 'Sushi', 'Sashimi', 
        'Phở cuốn', 'Nộm', 'Salad', 'Mì Lạnh', 
        'Bia', 'Cafe', 'Bạc xỉu', 'Ôlong', 'Hồng trà'
    );
  }

  // --- 2. LOGIC THEO ĐIỀU KIỆN MƯA/NẮNG ---
  // Mã WMO: 51-67 (Mưa nhỏ/vừa), 80-82 (Mưa lớn), 95-99 (Dông bão)
  const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
  
  if (rainCodes.includes(weathercode)) {
    // 🌧️ Trời Mưa:
    // Ưu tiên món nước nóng hổi, món ship về nhà tiện lợi (Pizza, Gà rán)
    keywords.push(
        'Cháo', 'Súp', 'Phở', 'Mì', 'Lẩu', 
        'Pizza', 'Gà quay', 'Cơm rang', 'Bò Sốt Vang'
    );
    // Loại bỏ các món lạnh/kem khi trời mưa (trừ khi thích cảm giác mạnh)
    keywords = keywords.filter(k => !['Kem', 'Chè', 'Bia', 'Freeze', 'Mì Lạnh'].includes(k));
  }

  if (keywords.length === 0) return defaultKeywords;

  // Loại bỏ trùng lặp
  return [...new Set(keywords)];
};