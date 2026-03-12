/**
 * Department Model
 * Represents organizational departments (IT, Keuangan, Akuntansi, HR, etc.)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 20]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  network_range: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'IP range assigned to this department (e.g., 10.0.1.0/24)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'departments',
  indexes: [
    { fields: ['code'] },
    { fields: ['is_active'] }
  ]
});

module.exports = Department;
