module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Category", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['food_type', 'venue_type', 'feature']] // 
      }
    },
    icon_url: DataTypes.TEXT
  }, {
    tableName: 'Categories',
    timestamps: false
  });
};