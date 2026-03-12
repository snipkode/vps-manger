/**
 * WireGuard Service
 * Handle all WireGuard operations (wg, wg-quick commands)
 */

const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { logAction } = require('../utils/auditLogger');

const execAsync = promisify(exec);

class WireGuardService {
  constructor() {
    this.interfaceName = process.env.WG_INTERFACE_NAME || 'wg0';
    this.interfacePort = parseInt(process.env.WG_INTERFACE_PORT) || 51820;
    this.subnet = process.env.WG_SUBNET || '10.0.0.0/24';
    this.configPath = `/etc/wireguard/${this.interfaceName}.conf`;
    this.configDir = '/etc/wireguard';
  }

  /**
   * Generate WireGuard key pair
   */
  async generateKeys() {
    try {
      const { stdout: privateKey } = await execAsync('wg genkey');
      const { stdout: publicKey } = await execAsync(`echo "${privateKey.trim()}" | wg pubkey`);
      const { stdout: presharedKey } = await execAsync('wg genpsk');

      return {
        privateKey: privateKey.trim(),
        publicKey: publicKey.trim(),
        presharedKey: presharedKey.trim()
      };
    } catch (error) {
      logger.error('Failed to generate WireGuard keys:', error);
      throw new Error('Failed to generate WireGuard keys');
    }
  }

  /**
   * Get interface status
   */
  async getInterfaceStatus() {
    try {
      const { stdout } = await execAsync(`wg show ${this.interfaceName}`);
      return this.parseWgShowOutput(stdout);
    } catch (error) {
      if (error.message.includes('Cannot find device')) {
        return { active: false, message: 'WireGuard interface not active' };
      }
      logger.error('Failed to get interface status:', error);
      throw error;
    }
  }

  /**
   * Parse wg show output
   */
  parseWgShowOutput(output) {
    const lines = output.split('\n');
    const result = {
      active: true,
      interface: this.interfaceName,
      publicKey: '',
      listeningPort: '',
      peers: []
    };

    let currentPeer = null;

    for (const line of lines) {
      if (line.startsWith('public key:')) {
        result.publicKey = line.split(':')[1].trim();
      } else if (line.startsWith('listening port:')) {
        result.listeningPort = line.split(':')[1].trim();
      } else if (line.startsWith('peer:')) {
        if (currentPeer) {
          result.peers.push(currentPeer);
        }
        currentPeer = {
          publicKey: line.split(':')[1].trim(),
          presharedKey: '',
          endpoint: '',
          allowedIps: [],
          latestHandshake: '',
          transferRx: 0,
          transferTx: 0,
          persistentKeepalive: ''
        };
      } else if (currentPeer) {
        if (line.startsWith('preshared key:')) {
          currentPeer.presharedKey = line.split(':')[1].trim();
        } else if (line.startsWith('endpoint:')) {
          currentPeer.endpoint = line.split(':')[1].trim();
        } else if (line.startsWith('allowed ips:')) {
          currentPeer.allowedIps = line.split(':')[1].trim().split(', ');
        } else if (line.startsWith('latest handshake:')) {
          currentPeer.latestHandshake = line.split(':')[1].trim();
        } else if (line.startsWith('transfer:')) {
          const transferMatch = line.match(/transfer:\s*([\d.]+\s*[KMG]?B)\s*received,\s*([\d.]+\s*[KMG]?B)\s*sent/);
          if (transferMatch) {
            currentPeer.transferRx = this.parseBytes(transferMatch[1]);
            currentPeer.transferTx = this.parseBytes(transferMatch[2]);
          }
        } else if (line.startsWith('persistent keepalive:')) {
          currentPeer.persistentKeepalive = line.split(':')[1].trim();
        }
      }
    }

    if (currentPeer) {
      result.peers.push(currentPeer);
    }

    return result;
  }

  /**
   * Parse bytes string to number
   */
  parseBytes(str) {
    const match = str.match(/([\d.]+)\s*([KMG]?B)/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    switch (unit) {
      case 'KB': return value * 1024;
      case 'MB': return value * 1024 * 1024;
      case 'GB': return value * 1024 * 1024 * 1024;
      default: return value;
    }
  }

  /**
   * Get next available IP in subnet
   */
  async getNextAvailableIP(usedIPs = []) {
    const [baseIP, prefix] = this.subnet.split('/');
    const [octet1, octet2, octet3, octet4] = baseIP.split('.').map(Number);
    
    // Start from .2 (assuming .1 is gateway)
    for (let i = 2; i < 254; i++) {
      const candidateIP = `${octet1}.${octet2}.${octet3}.${i}`;
      if (!usedIPs.includes(candidateIP)) {
        return candidateIP;
      }
    }
    
    throw new Error('No available IP addresses in subnet');
  }

  /**
   * Generate peer configuration
   */
  generatePeerConfig(peer, serverPublicKey, serverEndpoint) {
    return `[Interface]
PrivateKey = ${peer.private_key}
Address = ${peer.ip_address}/32
DNS = 8.8.8.8, 8.8.4.4

[Peer]
PublicKey = ${serverPublicKey}
PresharedKey = ${peer.preshared_key}
Endpoint = ${serverEndpoint}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = ${peer.persistent_keepalive || 25}
`;
  }

  /**
   * Add peer to WireGuard config
   */
  async addPeer(peer) {
    try {
      // Check if config file exists
      try {
        await fs.access(this.configPath);
      } catch {
        // Create default config
        await this.createDefaultConfig();
      }

      // Read current config
      let config = await fs.readFile(this.configPath, 'utf-8');

      // Add peer section
      const peerSection = `

# Peer: ${peer.name} (${peer.ip_address})
[Peer]
PublicKey = ${peer.public_key}
PresharedKey = ${peer.preshared_key || ''}
AllowedIPs = ${peer.ip_address}/32
`;

      config += peerSection;

      // Write updated config
      await fs.writeFile(this.configPath, config, 'utf-8');

      // Apply configuration if interface is running
      try {
        await execAsync(`wg set ${this.interfaceName} peer ${peer.public_key} preshared-key <(echo "${peer.preshared_key || '/dev/null'}") allowed-ips ${peer.ip_address}/32`);
      } catch (wgError) {
        logger.warn('Failed to apply peer immediately:', wgError);
      }

      logger.info(`Peer added: ${peer.name} (${peer.ip_address})`);
      
      return true;
    } catch (error) {
      logger.error('Failed to add peer:', error);
      throw error;
    }
  }

  /**
   * Remove peer from WireGuard config
   */
  async removePeer(publicKey) {
    try {
      // Remove from running config
      try {
        await execAsync(`wg set ${this.interfaceName} peer ${publicKey} remove`);
      } catch (wgError) {
        logger.warn('Peer not in running config:', wgError);
      }

      // Remove from config file
      try {
        let config = await fs.readFile(this.configPath, 'utf-8');
        const lines = config.split('\n');
        const newLines = [];
        let skipSection = false;

        for (const line of lines) {
          if (line.startsWith('[Peer]')) {
            // Check if next line contains this public key
            const nextLineIndex = lines.indexOf(line) + 1;
            if (nextLineIndex < lines.length && lines[nextLineIndex].includes(publicKey)) {
              skipSection = true;
              continue;
            }
          }
          
          if (skipSection && line.startsWith('[Peer]')) {
            skipSection = false;
            newLines.push(line);
            continue;
          }
          
          if (!skipSection) {
            newLines.push(line);
          }
        }

        await fs.writeFile(this.configPath, newLines.join('\n'), 'utf-8');
      } catch (fileError) {
        logger.warn('Failed to update config file:', fileError);
      }

      logger.info(`Peer removed: ${publicKey}`);
      return true;
    } catch (error) {
      logger.error('Failed to remove peer:', error);
      throw error;
    }
  }

  /**
   * Create default WireGuard config
   */
  async createDefaultConfig() {
    const keys = await this.generateKeys();
    
    const config = `# WireGuard Server Configuration
# Generated by VPS Manager
# ${new Date().toISOString()}

[Interface]
PrivateKey = ${keys.privateKey}
Address = ${this.subnet}
ListenPort = ${this.interfacePort}
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Peers will be added below this line
`;

    // Ensure directory exists
    await fs.mkdir(this.configDir, { recursive: true });
    await fs.writeFile(this.configPath, config, 'utf-8');
    
    // Set secure permissions
    try {
      await execAsync('chmod 600 ' + this.configPath);
    } catch (chmodError) {
      logger.warn('Failed to set config permissions:', chmodError);
    }

    return { publicKey: keys.publicKey };
  }

  /**
   * Start WireGuard interface
   */
  async startInterface() {
    try {
      await execAsync(`wg-quick up ${this.interfaceName}`);
      logger.info(`WireGuard interface ${this.interfaceName} started`);
      return true;
    } catch (error) {
      logger.error('Failed to start WireGuard interface:', error);
      throw error;
    }
  }

  /**
   * Stop WireGuard interface
   */
  async stopInterface() {
    try {
      await execAsync(`wg-quick down ${this.interfaceName}`);
      logger.info(`WireGuard interface ${this.interfaceName} stopped`);
      return true;
    } catch (error) {
      logger.error('Failed to stop WireGuard interface:', error);
      throw error;
    }
  }

  /**
   * Restart WireGuard interface
   */
  async restartInterface() {
    await this.stopInterface();
    await this.startInterface();
  }

  /**
   * Sync database peers to WireGuard config
   */
  async syncPeers(peers) {
    try {
      // Get server keys
      let serverPrivateKey, serverPublicKey;
      
      try {
        const { stdout } = await execAsync(`wg show ${this.interfaceName} private-key`);
        serverPrivateKey = stdout.trim();
        const { stdout: pubKey } = await execAsync(`echo "${serverPrivateKey}" | wg pubkey`);
        serverPublicKey = pubKey.trim();
      } catch {
        const keys = await this.createDefaultConfig();
        serverPublicKey = keys.publicKey;
      }

      // Rebuild config with all peers
      let config = `[Interface]
PrivateKey = ${serverPrivateKey}
Address = ${this.subnet}
ListenPort = ${this.interfacePort}
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

`;

      for (const peer of peers) {
        config += `# Peer: ${peer.name} (${peer.ip_address})
[Peer]
PublicKey = ${peer.public_key}
PresharedKey = ${peer.preshared_key || ''}
AllowedIPs = ${peer.ip_address}/32

`;
      }

      await fs.writeFile(this.configPath, config, 'utf-8');
      
      // Restart interface to apply changes
      await this.restartInterface();

      logger.info(`Synced ${peers.length} peers to WireGuard`);
      return { serverPublicKey, serverEndpoint: `${process.env.WG_SERVER_ENDPOINT || 'server-ip:' + this.interfacePort}` };
    } catch (error) {
      logger.error('Failed to sync peers:', error);
      throw error;
    }
  }
}

module.exports = new WireGuardService();
