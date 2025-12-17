module.exports = (sequelize, DataTypes) => {
    return sequelize.define("LocationImage", {
        location_id: { type: DataTypes.INTEGER, allowNull: false },
        image_url: { type: DataTypes.TEXT, allowNull: false },
        description: DataTypes.STRING(255), // Mới thêm
        is_main: { type: DataTypes.BOOLEAN, defaultValue: false },
        uploaded_at: { // Mới thêm
             type: DataTypes.DATE,
             defaultValue: DataTypes.NOW
        }
    }, { tableName: 'LocationImages', timestamps: false });
};