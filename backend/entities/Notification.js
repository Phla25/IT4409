module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Notification", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: DataTypes.TEXT,
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['proposal_approved', 'proposal_rejected', 'review_reply', 'system']] // [cite: 13]
      }
    },
    related_id: DataTypes.INTEGER, // ID của đối tượng liên quan (review_id hoặc proposal_id)
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'Notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_notifications_user_unread', // Định nghĩa Index từ SQL [cite: 14]
        fields: ['user_id', 'is_read']
      }
    ]
  });
};