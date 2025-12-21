module.exports = (sequelize, DataTypes) => sequelize.define("LocationImage", {
    location_id: { type: DataTypes.INTEGER, allowNull: false },
    image_url: { type: DataTypes.TEXT, allowNull: false },
    is_main: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'LocationImages', timestamps: false });
