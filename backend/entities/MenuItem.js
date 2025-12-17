module.exports = (sequelize, DataTypes) => {
  return sequelize.define("MenuItem", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_dish_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    custom_name: DataTypes.STRING(100),
    price: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    average_rating: { 
      type: DataTypes.DECIMAL(3, 2), 
      defaultValue: 0.0 
    },
    review_count: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0 
    }
  }, {
    tableName: 'MenuItems',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
};