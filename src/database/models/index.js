/**
 * Database Models Index
 * Export all models and define associations
 */

const { sequelize } = require('../index');

// Import models
const Department = require('./Department');
const User = require('./User');
const WireGuardPeer = require('./WireGuardPeer');
const FirewallRule = require('./FirewallRule');
const AuditLog = require('./AuditLog');
const SystemLog = require('./SystemLog');

// Define associations
Department.hasMany(User, { as: 'users', foreignKey: 'department_id', onDelete: 'SET NULL' });
User.belongsTo(Department, { as: 'department', foreignKey: 'department_id' });

Department.hasMany(FirewallRule, { as: 'firewall_rules', foreignKey: 'department_id', onDelete: 'CASCADE' });
FirewallRule.belongsTo(Department, { as: 'department', foreignKey: 'department_id' });

User.hasMany(WireGuardPeer, { as: 'peers', foreignKey: 'owner_id', onDelete: 'CASCADE' });
WireGuardPeer.belongsTo(User, { as: 'owner', foreignKey: 'owner_id' });

WireGuardPeer.hasMany(FirewallRule, { as: 'firewall_rules', foreignKey: 'peer_id', onDelete: 'CASCADE' });
FirewallRule.belongsTo(WireGuardPeer, { as: 'peer', foreignKey: 'peer_id' });

User.hasMany(AuditLog, { as: 'audit_logs', foreignKey: 'user_id', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

module.exports = {
  sequelize,
  Department,
  User,
  WireGuardPeer,
  FirewallRule,
  AuditLog,
  SystemLog
};
