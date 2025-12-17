module.exports = (sequelize, DataTypes) => {
  return sequelize.define("BaseDish", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: DataTypes.TEXT
  }, {
    tableName: 'BaseDishes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
};