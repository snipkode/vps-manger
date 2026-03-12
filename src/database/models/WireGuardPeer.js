/**
 * WireGuard Peer Model
 * VPN peer configuration and status
 */

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../index');

const PEER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  REVOKED: 'revoked'
};

const WireGuardPeer = sequelize.define('WireGuardPeer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  public_key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  private_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Encrypted private key (optional, for client config)'
  },
  preshared_key: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      isIP: true
    }
  },
  allowed_ips: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comma-separated list of allowed IPs',
    get() {
      const rawValue = this.getDataValue('allowed_ips');
      return rawValue ? rawValue.split(',') : [];
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('allowed_ips', value.join(','));
      } else {
        this.setDataValue('allowed_ips', value);
      }
    }
  },
  endpoint: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Remote endpoint (IP:port) for this peer'
  },
  persistent_keepalive: {
    type: DataTypes.INTEGER,
    defaultValue: 25,
    comment: 'Persistent keepalive interval in seconds'
  },
  status: {
    type: DataTypes.ENUM(...Object.values(PEER_STATUS)),
    defaultValue: PEER_STATUS.ACTIVE
  },
  last_handshake: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last handshake time from wg show'
  },
  rx_bytes: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: 'Received bytes'
  },
  tx_bytes: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: 'Transmitted bytes'
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Peer expiration date'
  },
  config_generated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  config_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'wireguard_peers',
  indexes: [
    { fields: ['uuid'] },
    { fields: ['public_key'] },
    { fields: ['ip_address'] },
    { fields: ['status'] },
    { fields: ['owner_id'] },
    { fields: ['department_id'] }
  ]
});

WireGuardPeer.STATUS = PEER_STATUS;

module.exports = WireGuardPeer;
