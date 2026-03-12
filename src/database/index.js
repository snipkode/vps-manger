/**
 * Database Configuration
 * SQLite with Sequelize ORM
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/vps-manager.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg) => logger.debug(msg),
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = { sequelize };
