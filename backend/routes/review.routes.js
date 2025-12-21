const controller = require("../controllers/review.controller");

module.exports = function(app) {
  // Config header CORS (nếu chưa có global)
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // --- ĐỊNH NGHĨA CÁC API ---

  // 1. Tạo đánh giá (POST)
  // URL: http://localhost:5000/api/reviews
  app.post("/api/reviews", controller.create);

  // 2. Lấy danh sách đánh giá (GET)
  // URL: http://localhost:5000/api/reviews?location_id=1
  app.get("/api/reviews", controller.findAll);
};