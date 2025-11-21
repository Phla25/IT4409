const { Sequelize, DataTypes } = require('sequelize');
const config = require('../configs/db.config.js');

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
    host: config.HOST,
    dialect: config.dialect,
    logging: false,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// --- IMPORT MODELS ---
db.User = require('./User')(sequelize, DataTypes);
db.Category = require('./Category')(sequelize, DataTypes);
db.Location = require('./Location')(sequelize, DataTypes);
db.LocationImage = require('./LocationImage')(sequelize, DataTypes);
db.Dish = require('./Dish')(sequelize, DataTypes); // [cite: 7]
db.Review = require('./Review')(sequelize, DataTypes);
db.LocationProposal = require('./LocationProposal')(sequelize, DataTypes);

// Các model mới thêm vào
db.LocationCategory = require('./LocationCategory')(sequelize, DataTypes);
db.Favorite = require('./Favorite')(sequelize, DataTypes);
db.UserActivityLog = require('./UserActivityLog')(sequelize, DataTypes);
db.Notification = require('./Notification')(sequelize, DataTypes);

// --- ASSOCIATIONS (Quan hệ) ---

// 1. Users & Locations
db.User.hasMany(db.Location, { foreignKey: 'created_by_user_id', as: 'createdLocations' });
db.Location.belongsTo(db.User, { foreignKey: 'created_by_user_id', as: 'creator' });

// 2. Location Categories (N-N) 
// Quan trọng: dùng bảng trung gian LocationCategories
db.Location.belongsToMany(db.Category, { 
    through: db.LocationCategory, 
    foreignKey: 'location_id', 
    otherKey: 'category_id' 
});
db.Category.belongsToMany(db.Location, { 
    through: db.LocationCategory, 
    foreignKey: 'category_id', 
    otherKey: 'location_id' 
});

// 3. Favorites (N-N) 
db.User.belongsToMany(db.Location, { 
    through: db.Favorite, 
    foreignKey: 'user_id', 
    otherKey: 'location_id',
    as: 'favoriteLocations' // user.getFavoriteLocations()
});
db.Location.belongsToMany(db.User, { 
    through: db.Favorite, 
    foreignKey: 'location_id', 
    otherKey: 'user_id',
    as: 'favoritedByUsers' // location.getFavoritedByUsers()
});

// 4. User Activity Log 
db.User.hasMany(db.UserActivityLog, { foreignKey: 'user_id' });
db.UserActivityLog.belongsTo(db.User, { foreignKey: 'user_id' });

db.Location.hasMany(db.UserActivityLog, { foreignKey: 'location_id' });
db.UserActivityLog.belongsTo(db.Location, { foreignKey: 'location_id' });

// 5. Notifications [cite: 13]
db.User.hasMany(db.Notification, { foreignKey: 'user_id', as: 'notifications' });
db.Notification.belongsTo(db.User, { foreignKey: 'user_id' });

// 6. Dishes & Images (Các quan hệ cũ)
db.Location.hasMany(db.Dish, { foreignKey: 'location_id', as: 'dishes' });
db.Dish.belongsTo(db.Location, { foreignKey: 'location_id' });

db.Location.hasMany(db.LocationImage, { foreignKey: 'location_id', as: 'images' });
db.LocationImage.belongsTo(db.Location, { foreignKey: 'location_id' });

module.exports = db;