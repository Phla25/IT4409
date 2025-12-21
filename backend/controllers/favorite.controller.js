// backend/controllers/favorite.controller.js
const favoriteService = require("../services/favorite.service");

exports.toggle = async (req, res) => {
  try {
    const { location_id } = req.body;
    const user_id = req.user.id; // Giả sử middleware auth đã gán user vào req

    if (!location_id) return res.status(400).json({ message: "Thiếu location_id" });

    const result = await favoriteService.toggleFavorite(user_id, location_id);
    return res.status(200).json({ success: true, ...result });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getMyFavorites = async (req, res) => {
  try {
    const user_id = req.user.id;
    const data = await favoriteService.getFavorites(user_id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

exports.checkStatus = async (req, res) => {
  try {
    const { location_id } = req.query;
    const user_id = req.user.id;
    const isFavorited = await favoriteService.checkIsFavorited(user_id, location_id);
    return res.status(200).json({ success: true, isFavorited });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};