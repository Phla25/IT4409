module.exports = (sequelize, DataTypes) => {
  return sequelize.define("LocationCategory", {
    location_id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Composite Primary Key
      references: {
        model: 'Locations',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Composite Primary Key
      references: {
        model: 'Categories',
        key: 'id'
      }
    }
  }, {
    tableName: 'LocationCategories',
    timestamps: false // Bảng này trong SQL không có created_at/updated_at
  });
};