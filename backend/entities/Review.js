module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Review", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    location_id: {
      type: DataTypes.INTEGER
      // Lưu ý: Có thể null nếu review MenuItem, nhưng logic DB check OR nên ở đây để lỏng
    },
    menu_item_id: DataTypes.INTEGER, // Thay thế dish_id cũ
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 }
    },
    comment: DataTypes.TEXT,
    review_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { isIn: [['location', 'dish']] }
    },
    images: DataTypes.JSONB, // Thêm cột JSONB lưu mảng ảnh
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'Reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
};