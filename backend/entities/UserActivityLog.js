module.exports = (sequelize, DataTypes) => {
  return sequelize.define("UserActivityLog", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true 
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    activity_type: {
      type: DataTypes.STRING(50),
      validate: {
        isIn: [['view', 'search', 'favorite']] // Check constraints 
      }
    }
  }, {
    tableName: 'UserActivityLog',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
};