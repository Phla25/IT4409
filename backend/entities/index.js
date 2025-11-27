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

// --- 1. IMPORT MODELS ---
db.User = require('./User')(sequelize, DataTypes);
db.Category = require('./Category')(sequelize, DataTypes);
db.Location = require('./Location')(sequelize, DataTypes);
db.LocationImage = require('./LocationImage')(sequelize, DataTypes);
db.LocationProposal = require('./LocationProposal')(sequelize, DataTypes);
db.Review = require('./Review')(sequelize, DataTypes);
db.Favorite = require('./Favorite')(sequelize, DataTypes);
db.UserActivityLog = require('./UserActivityLog')(sequelize, DataTypes);
db.Notification = require('./Notification')(sequelize, DataTypes);
db.LocationCategory = require('./LocationCategory')(sequelize, DataTypes);

// Models Mới cho Menu/Dish
db.BaseDish = require('./BaseDish')(sequelize, DataTypes);
db.MenuItem = require('./MenuItem')(sequelize, DataTypes);
db.BaseDishCategory = require('./BaseDishCategory')(sequelize, DataTypes);
db.MenuItemImage = require('./MenuItemImage')(sequelize, DataTypes);


// --- 2. ASSOCIATIONS (QUAN HỆ) ---

// === A. Users & Locations ===
db.User.hasMany(db.Location, { foreignKey: 'created_by_user_id', as: 'createdLocations' });
db.Location.belongsTo(db.User, { foreignKey: 'created_by_user_id', as: 'creator' });

// === B. Categories & Locations (N-N) ===
db.Location.belongsToMany(db.Category, { 
    through: db.LocationCategory, 
    foreignKey: 'location_id', 
    otherKey: 'category_id',
    as: 'categories'
});
db.Category.belongsToMany(db.Location, { 
    through: db.LocationCategory, 
    foreignKey: 'category_id', 
    otherKey: 'location_id',
    as: 'locations'
});

// === C. Categories & BaseDishes (N-N) [MỚI] ===
db.BaseDish.belongsToMany(db.Category, {
    through: db.BaseDishCategory,
    foreignKey: 'base_dish_id',
    otherKey: 'category_id',
    as: 'categories'
});
db.Category.belongsToMany(db.BaseDish, {
    through: db.BaseDishCategory,
    foreignKey: 'category_id',
    otherKey: 'base_dish_id',
    as: 'dishes'
});

// === D. Menu Structure (Location - MenuItem - BaseDish) [MỚI] ===
// 1 Location có nhiều MenuItem
db.Location.hasMany(db.MenuItem, { foreignKey: 'location_id', as: 'menuItems' });
db.MenuItem.belongsTo(db.Location, { foreignKey: 'location_id', as: 'location' });

// 1 BaseDish có mặt trong nhiều MenuItem (ở các quán khác nhau)
db.BaseDish.hasMany(db.MenuItem, { foreignKey: 'base_dish_id', as: 'instances' });
db.MenuItem.belongsTo(db.BaseDish, { foreignKey: 'base_dish_id', as: 'baseDish' });

// === E. Images ===
// Location Images
db.Location.hasMany(db.LocationImage, { foreignKey: 'location_id', as: 'images' });
db.LocationImage.belongsTo(db.Location, { foreignKey: 'location_id' });

// MenuItem Images [MỚI]
db.MenuItem.hasMany(db.MenuItemImage, { foreignKey: 'menu_item_id', as: 'images' });
db.MenuItemImage.belongsTo(db.MenuItem, { foreignKey: 'menu_item_id' });

// === F. Reviews ===
// Review belongs to User
db.User.hasMany(db.Review, { foreignKey: 'user_id' });
db.Review.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

// Review belongs to Location (Optional)
db.Location.hasMany(db.Review, { foreignKey: 'location_id', as: 'reviews' });
db.Review.belongsTo(db.Location, { foreignKey: 'location_id', as: 'location' });

// Review belongs to MenuItem (Optional) [MỚI]
db.MenuItem.hasMany(db.Review, { foreignKey: 'menu_item_id', as: 'reviews' });
db.Review.belongsTo(db.MenuItem, { foreignKey: 'menu_item_id', as: 'menuItem' });

// === G. Favorites & Logs & Notifications ===
// Favorites
db.User.belongsToMany(db.Location, { 
    through: db.Favorite, 
    foreignKey: 'user_id', 
    otherKey: 'location_id',
    as: 'favoriteLocations'
});
db.Location.belongsToMany(db.User, { 
    through: db.Favorite, 
    foreignKey: 'location_id', 
    otherKey: 'user_id',
    as: 'favoritedByUsers'
});

// Activity Log
db.User.hasMany(db.UserActivityLog, { foreignKey: 'user_id' });
db.UserActivityLog.belongsTo(db.User, { foreignKey: 'user_id' });
db.Location.hasMany(db.UserActivityLog, { foreignKey: 'location_id' });
db.UserActivityLog.belongsTo(db.Location, { foreignKey: 'location_id' });

// Notifications
db.User.hasMany(db.Notification, { foreignKey: 'user_id', as: 'notifications' });
db.Notification.belongsTo(db.User, { foreignKey: 'user_id' });

module.exports = db;