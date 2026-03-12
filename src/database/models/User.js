/**
 * User Model
 * System users with RBAC roles
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../index');

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DEPARTMENT_HEAD: 'department_head',
  USER: 'user'
};

const PERMISSIONS = {
  // WireGuard permissions
  'wireguard:create': ['super_admin', 'admin', 'department_head'],
  'wireguard:view': ['super_admin', 'admin', 'department_head', 'user'],
  'wireguard:edit': ['super_admin', 'admin', 'department_head'],
  'wireguard:delete': ['super_admin', 'admin'],
  
  // Firewall permissions
  'firewall:create': ['super_admin', 'admin', 'department_head'],
  'firewall:view': ['super_admin', 'admin', 'department_head', 'user'],
  'firewall:edit': ['super_admin', 'admin', 'department_head'],
  'firewall:delete': ['super_admin', 'admin'],
  
  // Monitoring permissions
  'monitoring:view': ['super_admin', 'admin', 'department_head', 'user'],
  
  // Audit permissions
  'audit:view': ['super_admin', 'admin'],
  
  // System permissions (execute wg/ufw commands)
  'system:execute': ['super_admin', 'admin']
};

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM(...Object.values(ROLES)),
    defaultValue: ROLES.USER,
    allowNull: false
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  password_changed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] },
    { fields: ['department_id'] },
    { fields: ['is_active'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.password_changed_at = new Date();
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.hasPermission = function(permission) {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(this.role);
};

User.prototype.hasRole = function(role) {
  return this.role === role;
};

// Static methods
User.ROLES = ROLES;
User.PERMISSIONS = PERMISSIONS;

User.hasPermission = function(role, permission) {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
};

module.exports = User;
