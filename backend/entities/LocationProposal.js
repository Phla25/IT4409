module.exports = (sequelize, DataTypes) => {
  return sequelize.define("LocationProposal", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: DataTypes.TEXT,
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    district: DataTypes.STRING(100),
    latitude: DataTypes.DECIMAL(10, 8),
    longitude: DataTypes.DECIMAL(11, 8),
    phone_number: DataTypes.STRING(20),
    proposed_by_user_id: DataTypes.INTEGER,
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'approved', 'rejected']] // 
      }
    },
    rejection_reason: DataTypes.TEXT,
    reviewed_by_admin_id: DataTypes.INTEGER,
    reviewed_at: DataTypes.DATE // 
  }, {
    tableName: 'LocationProposals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
};