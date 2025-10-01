// server/models/index.js
const Sequelize = require('sequelize');

// Create a Sequelize connection instance (update credentials for your database)
const sequelize = new Sequelize('your_database_name', 'your_username', 'your_password', {
  host: 'localhost',
  dialect: 'mysql'
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import model definitions
db.registers = require('./register.model')(sequelize, Sequelize.DataTypes);
db.rechecks = require('./recheck.model')(sequelize, Sequelize.DataTypes);

// Define associations between models
db.registers.hasMany(db.rechecks, { foreignKey: 'id', sourceKey: 'id' });
db.rechecks.belongsTo(db.registers, { foreignKey: 'id', targetKey: 'id' });

module.exports = db;