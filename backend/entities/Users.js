module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false
    },
    password_hash: {
      type: DataTypes.STRING(255)
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    avatar_url: DataTypes.TEXT,
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'admin']] // 
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    social_id: DataTypes.STRING(255)
  }, {
    tableName: 'Users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // File SQL không có updated_at
  });

  return User;
};