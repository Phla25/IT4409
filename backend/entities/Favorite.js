module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Favorite", {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    location_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Locations',
        key: 'id'
      }
    }
  }, {
    tableName: 'Favorites',
    timestamps: true,
    createdAt: 'created_at', // Map cột created_at 
    updatedAt: false         // Không có updated_at
  });
};