module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Review", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    dish_id: DataTypes.INTEGER, // Có thể null nếu review địa điểm
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5 // 
      }
    },
    comment: DataTypes.TEXT,
    review_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['location', 'dish']]
      }
    },
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