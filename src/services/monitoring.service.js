/**
 * System Monitoring Service
 * Monitor CPU, Memory, Disk, Network
 */

const si = require('systeminformation');
const logger = require('../utils/logger');

class MonitoringService {
  /**
   * Get CPU information and usage
   */
  async getCPUInfo() {
    try {
      const [cpu, currentLoad] = await Promise.all([
        si.cpu(),
        si.currentLoad()
      ]);

      return {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        speed: cpu.speed,
        cores: cpu.cores,
        threads: cpu.processors,
        socket: cpu.socket,
        usage: {
          current: currentLoad.currentLoad,
          user: currentLoad.cpuload,
          system: currentLoad.cpuloadSystem,
          idle: 100 - currentLoad.currentLoad
        },
        temperature: currentLoad.temp || null
      };
    } catch (error) {
      logger.error('Failed to get CPU info:', error);
      throw error;
    }
  }

  /**
   * Get Memory information and usage
   */
  async getMemoryInfo() {
    try {
      const mem = await si.mem();

      return {
        total: this.formatBytes(mem.total),
        totalBytes: mem.total,
        used: this.formatBytes(mem.used),
        usedBytes: mem.used,
        free: this.formatBytes(mem.free),
        freeBytes: mem.free,
        available: this.formatBytes(mem.available),
        availableBytes: mem.available,
        usage: {
          percent: parseFloat(((mem.used / mem.total) * 100).toFixed(2)),
          used: mem.used,
          free: mem.free
        },
        swap: {
          total: this.formatBytes(mem.swap),
          totalBytes: mem.swap,
          used: this.formatBytes(mem.swapused),
          usedBytes: mem.swapused,
          free: this.formatBytes(mem.swap - mem.swapused),
          usage: parseFloat((((mem.swapused) / mem.swap) * 100).toFixed(2))
        }
      };
    } catch (error) {
      logger.error('Failed to get memory info:', error);
      throw error;
    }
  }

  /**
   * Get Disk information and usage
   */
  async getDiskInfo() {
    try {
      const fsSize = await si.fsSize();
      const blockDevices = await si.blockDevices();

      const disks = fsSize.map(disk => ({
        filesystem: disk.fs,
        type: disk.type,
        size: this.formatBytes(disk.size),
        sizeBytes: disk.size,
        used: this.formatBytes(disk.used),
        usedBytes: disk.used,
        available: this.formatBytes(disk.available),
        availableBytes: disk.available,
        usage: parseFloat(disk.use.toFixed(2)),
        mount: disk.mount
      }));

      return {
        disks,
        blockDevices: blockDevices.map(bd => ({
          name: bd.name,
          type: bd.type,
          size: this.formatBytes(bd.size),
          sizeBytes: bd.size,
          removable: bd.removable,
          protocol: bd.protocol
        }))
      };
    } catch (error) {
      logger.error('Failed to get disk info:', error);
      throw error;
    }
  }

  /**
   * Get Network information
   */
  async getNetworkInfo() {
    try {
      const [networkInterfaces, networkStats, networkGateway] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats(),
        si.networkGatewayDefault()
      ]);

      return {
        interfaces: networkInterfaces.map(ni => ({
          iface: ni.iface,
          ip4: ni.ip4,
          ip6: ni.ip6,
          mac: ni.mac,
          internal: ni.internal,
          virtual: ni.virtual
        })),
        stats: networkStats.map(ns => ({
          iface: ns.iface,
          rxBytes: this.formatBytes(ns.rx_bytes),
          rxBytesRaw: ns.rx_bytes,
          txBytes: this.formatBytes(ns.tx_bytes),
          txBytesRaw: ns.tx_bytes,
          rxErrors: ns.rx_errors,
          txErrors: ns.tx_errors,
          rxDropped: ns.rx_dropped,
          txDropped: ns.tx_dropped
        })),
        defaultInterface: networkGateway || null
      };
    } catch (error) {
      logger.error('Failed to get network info:', error);
      throw error;
    }
  }

  /**
   * Get OS information
   */
  async getOSInfo() {
    try {
      const [osInfo, time, uptime] = await Promise.all([
        si.osInfo(),
        si.time(),
        si.time()
      ]);

      return {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        codename: osInfo.codename,
        kernel: osInfo.kernel,
        arch: osInfo.arch,
        hostname: osInfo.hostname,
        uptime: this.formatUptime(uptime.uptime),
        uptimeSeconds: uptime.uptime,
        timezone: time.timezone
      };
    } catch (error) {
      logger.error('Failed to get OS info:', error);
      throw error;
    }
  }

  /**
   * Get complete system overview
   */
  async getSystemOverview() {
    try {
      const [cpu, memory, disk, network, os] = await Promise.all([
        this.getCPUInfo(),
        this.getMemoryInfo(),
        getDiskInfoSafe(),
        this.getNetworkInfo(),
        this.getOSInfo()
      ]);

      return {
        timestamp: new Date().toISOString(),
        cpu,
        memory,
        disk,
        network,
        os
      };
    } catch (error) {
      logger.error('Failed to get system overview:', error);
      throw error;
    }
  }

  /**
   * Get WireGuard specific stats
   */
  async getWireGuardStats() {
    try {
      const networkStats = await si.networkStats();
      const wgInterface = networkStats.find(ns => 
        ns.iface.toLowerCase().includes('wg')
      );

      if (!wgInterface) {
        return {
          active: false,
          message: 'WireGuard interface not found'
        };
      }

      return {
        active: true,
        interface: wgInterface.iface,
        rxBytes: wgInterface.rx_bytes,
        txBytes: wgInterface.tx_bytes,
        rxBytesFormatted: this.formatBytes(wgInterface.rx_bytes),
        txBytesFormatted: this.formatBytes(wgInterface.tx_bytes),
        totalTraffic: this.formatBytes(wgInterface.rx_bytes + wgInterface.tx_bytes)
      };
    } catch (error) {
      logger.error('Failed to get WireGuard stats:', error);
      return { active: false, error: error.message };
    }
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Format uptime seconds to human readable
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}

// Safe disk info wrapper
async function getDiskInfoSafe() {
  try {
    const si = require('systeminformation');
    return await si.fsSize();
  } catch (error) {
    logger.warn('Failed to get disk info:', error);
    return { disks: [], error: error.message };
  }
}

module.exports = new MonitoringService();
