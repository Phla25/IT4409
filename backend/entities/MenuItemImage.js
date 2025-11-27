module.exports = (sequelize, DataTypes) => {
  return sequelize.define("MenuItemImage", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    menu_item_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    image_url: { 
      type: DataTypes.TEXT, 
      allowNull: false 
    },
    is_main: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false 
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'MenuItemImages',
    timestamps: false 
  });
};