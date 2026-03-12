/**
 * Audit Log Model
 * Track all system activities and user actions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');

const ACTION_TYPE = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXECUTE: 'EXECUTE',
  GRANT: 'GRANT',
  REVOKE: 'REVOKE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT'
};

const ENTITY_TYPE = {
  USER: 'User',
  DEPARTMENT: 'Department',
  PEER: 'WireGuardPeer',
  FIREWALL_RULE: 'FirewallRule',
  SYSTEM: 'System'
};

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  action: {
    type: DataTypes.ENUM(...Object.values(ACTION_TYPE)),
    allowNull: false
  },
  entity_type: {
    type: DataTypes.ENUM(...Object.values(ENTITY_TYPE)),
    allowNull: false
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Cached username at time of action'
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  request_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON stringified request body',
    get() {
      const rawValue = this.getDataValue('request_data');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      if (value) {
        this.setDataValue('request_data', JSON.stringify(value));
      }
    }
  },
  response_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON stringified response',
    get() {
      const rawValue = this.getDataValue('response_data');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      if (value) {
        this.setDataValue('response_data', JSON.stringify(value));
      }
    }
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'success',
    comment: 'success or failure'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  indexes: [
    { fields: ['action'] },
    { fields: ['entity_type'] },
    { fields: ['entity_id'] },
    { fields: ['user_id'] },
    { fields: ['created_at'] }
  ]
});

AuditLog.ACTION = ACTION_TYPE;
AuditLog.ENTITY_TYPE = ENTITY_TYPE;

module.exports = AuditLog;
