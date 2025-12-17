module.exports = (sequelize, DataTypes) => {
  return sequelize.define("BaseDishCategory", {
    base_dish_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: 'BaseDishes', key: 'id' }
    },
    category_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: 'Categories', key: 'id' }
    }
  }, {
    tableName: 'BaseDishCategories',
    timestamps: false
  });
};