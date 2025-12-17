module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define("Location", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: DataTypes.TEXT,
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    district: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    phone_number: DataTypes.STRING(20),
    opening_hours: {
      type: DataTypes.JSONB // Hỗ trợ lưu cấu trúc giờ mở cửa phức tạp
    },
    min_price: DataTypes.INTEGER,
    max_price: DataTypes.INTEGER,
    google_maps_link: DataTypes.TEXT,
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    average_rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0
    },
    review_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    created_by_user_id: DataTypes.INTEGER
  }, {
    tableName: 'Locations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Location;
};