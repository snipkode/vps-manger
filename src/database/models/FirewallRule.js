/**
 * Firewall Rule Model
 * UFW rules associated with departments and peers
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');

const RULE_ACTION = {
  ALLOW: 'allow',
  DENY: 'deny',
  REJECT: 'reject',
  LIMIT: 'limit'
};

const RULE_PROTOCOL = {
  TCP: 'tcp',
  UDP: 'udp',
  ICMP: 'icmp',
  ANY: 'any'
};

const FirewallRule = sequelize.define('FirewallRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Rule name/description'
  },
  action: {
    type: DataTypes.ENUM(...Object.values(RULE_ACTION)),
    defaultValue: RULE_ACTION.ALLOW,
    allowNull: false
  },
  direction: {
    type: DataTypes.ENUM('in', 'out'),
    defaultValue: 'in',
    comment: 'Traffic direction'
  },
  protocol: {
    type: DataTypes.ENUM(...Object.values(RULE_PROTOCOL)),
    defaultValue: RULE_PROTOCOL.TCP
  },
  port: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Port or port range (e.g., 80, 443, 1000:2000)'
  },
  source_ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Source IP/CIDR (optional)'
  },
  destination_ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Destination IP/CIDR (optional)'
  },
  peer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'wireguard_peers',
      key: 'id'
    },
    comment: 'Associated WireGuard peer'
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    },
    comment: 'Department this rule applies to'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: 'Rule priority (lower = higher priority)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ufw_rule_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'UFW rule number for reference'
  },
  applied: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether rule has been applied to UFW'
  },
  applied_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'firewall_rules',
  indexes: [
    { fields: ['action'] },
    { fields: ['protocol'] },
    { fields: ['peer_id'] },
    { fields: ['department_id'] },
    { fields: ['is_active'] },
    { fields: ['applied'] }
  ]
});

FirewallRule.ACTION = RULE_ACTION;
FirewallRule.PROTOCOL = RULE_PROTOCOL;

module.exports = FirewallRule;
