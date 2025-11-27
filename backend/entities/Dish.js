module.exports = (sequelize, DataTypes) => sequelize.define("Dish", {
    location_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: DataTypes.TEXT,
    price: DataTypes.INTEGER,
    image_url: DataTypes.TEXT,
    category_id: DataTypes.INTEGER,
    average_rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0.0 },
    review_count: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'Dishes', timestamps: false });