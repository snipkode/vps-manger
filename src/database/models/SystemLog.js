/**
 * System Log Model
 * System-level logs (CPU, Disk, Network monitoring)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');

const LOG_LEVEL = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

const SystemLog = sequelize.define('SystemLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  level: {
    type: DataTypes.ENUM(...Object.values(LOG_LEVEL)),
    defaultValue: LOG_LEVEL.INFO
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Source component (e.g., monitoring, wireguard, firewall)'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON stringified metadata',
    get() {
      const rawValue = this.getDataValue('metadata');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      if (value) {
        this.setDataValue('metadata', JSON.stringify(value));
      }
    }
  },
  cpu_usage: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'CPU usage percentage at time of log'
  },
  memory_usage: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Memory usage percentage at time of log'
  },
  disk_usage: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Disk usage percentage at time of log'
  }
}, {
  tableName: 'system_logs',
  indexes: [
    { fields: ['level'] },
    { fields: ['source'] },
    { fields: ['created_at'] }
  ]
});

SystemLog.LEVEL = LOG_LEVEL;

module.exports = SystemLog;
