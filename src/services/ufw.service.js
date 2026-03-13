/**
 * UFW Firewall Service
 * Handle all UFW operations
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');

const execAsync = promisify(exec);

class UFWService {
  constructor() {
    this.enabled = null;
  }

  /**
   * Check UFW status
   */
  async getStatus() {
    try {
      const { stdout } = await execAsync('ufw status verbose');
      return this.parseUFWStatus(stdout);
    } catch (error) {
      logger.error('Failed to get UFW status:', error);
      throw new Error('Failed to get firewall status');
    }
  }

  /**
   * Parse UFW status output
   */
  parseUFWStatus(output) {
    const lines = output.split('\n');
    const result = {
      active: false,
      default: {
        incoming: 'deny (default)',
        outgoing: 'allow (default)',
        routed: 'disabled (default)'
      },
      rules: []
    };

    for (const line of lines) {
      // Check if active
      if (line.startsWith('Status:')) {
        result.active = line.includes('active');
      }

      // Parse default policies
      if (line.startsWith('Default:')) {
        const defaults = line.replace('Default:', '').trim();
        const parts = defaults.split(',').map(p => p.trim());
        for (const part of parts) {
          if (part.includes('incoming')) {
            result.default.incoming = part;
          } else if (part.includes('outgoing')) {
            result.default.outgoing = part;
          } else if (part.includes('routed')) {
            result.default.routed = part;
          }
        }
      }

      // Parse rules (skip header lines)
      if (line.startsWith('To') || line.startsWith('--') || line.startsWith('Before') || line.startsWith('After')) {
        continue;
      }

      // Parse rule line
      const ruleMatch = line.match(/^(\d+)\s+(\S+)\s+(.+?)(?:\s+\(([^)]+)\))?$/);
      if (ruleMatch) {
        const [, number, action, to, comment] = ruleMatch;
        
        // Parse destination
        const toParts = to.split(/\s+/);
        const protocol = toParts.find(p => ['tcp', 'udp', 'icmp'].includes(p)) || 'any';
        const port = toParts.find(p => p.includes('/'))?.split('/')[0] || null;
        const destination = toParts.find(p => p.includes('@') || this.isIP(p)) || null;

        result.rules.push({
          number: parseInt(number),
          action,
          protocol,
          port,
          destination: destination || 'any',
          comment: comment || '',
          raw: line.trim()
        });
      }
    }

    return result;
  }

  /**
   * Check if string is IP address
   */
  isIP(str) {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(str) || str.includes('/');
  }

  /**
   * Add UFW rule
   */
  async addRule(rule) {
    const {
      action = 'allow',
      direction = 'in',
      protocol = 'tcp',
      port,
      sourceIP,
      destinationIP
    } = rule;

    try {
      // Build command with correct UFW syntax
      // Syntax: ufw allow|deny|reject|limit [in|out] [proto PROTO] [from FROM] [to TO] [port PORT]
      let command = `ufw ${action}`;

      // Add direction only if it's 'out' (in is default)
      if (direction && direction === 'out') {
        command += ` ${direction}`;
      }

      if (protocol && protocol !== 'any') {
        command += ` proto ${protocol}`;
      }

      if (sourceIP) {
        command += ` from ${sourceIP}`;
      } else {
        command += ' from any';
      }

      if (destinationIP && destinationIP !== 'any') {
        command += ` to ${destinationIP}`;
      }

      if (port) {
        command += ` port ${port}`;
      }

      // Execute command (non-interactive)
      const { stdout } = await execAsync(`echo "y" | ${command}`);

      logger.info(`UFW rule added: ${command}`);

      return {
        success: true,
        message: 'Rule added successfully',
        output: stdout.trim()
      };
    } catch (error) {
      logger.error('Failed to add UFW rule:', error);
      throw new Error(`Failed to add firewall rule: ${error.message}`);
    }
  }

  /**
   * Delete UFW rule by number
   */
  async deleteRule(ruleNumber) {
    try {
      const { stdout } = await execAsync(`echo "y" | ufw delete ${ruleNumber}`);
      
      logger.info(`UFW rule ${ruleNumber} deleted`);
      
      return {
        success: true,
        message: `Rule ${ruleNumber} deleted successfully`,
        output: stdout.trim()
      };
    } catch (error) {
      logger.error('Failed to delete UFW rule:', error);
      throw new Error(`Failed to delete firewall rule: ${error.message}`);
    }
  }

  /**
   * Delete UFW rule by specification
   */
  async deleteRuleBySpec(rule) {
    const {
      action = 'allow',
      direction = 'in',
      protocol = 'tcp',
      port,
      sourceIP,
      destinationIP
    } = rule;

    try {
      let command = `ufw ${direction} delete ${action}`;

      if (protocol && protocol !== 'any') {
        command += ` proto ${protocol}`;
      }

      if (port) {
        command += ` port ${port}`;
      }

      if (sourceIP) {
        command += ` from ${sourceIP}`;
      } else {
        command += ' from any';
      }

      if (destinationIP) {
        command += ` to ${destinationIP}`;
      }

      const { stdout } = await execAsync(`echo "y" | ${command}`);
      
      logger.info(`UFW rule deleted: ${command}`);
      
      return {
        success: true,
        message: 'Rule deleted successfully',
        output: stdout.trim()
      };
    } catch (error) {
      logger.error('Failed to delete UFW rule:', error);
      throw new Error(`Failed to delete firewall rule: ${error.message}`);
    }
  }

  /**
   * Enable UFW
   */
  async enable() {
    try {
      const { stdout } = await execAsync('echo "y" | ufw enable');
      
      this.enabled = true;
      logger.info('UFW enabled');
      
      return {
        success: true,
        message: 'Firewall enabled successfully',
        output: stdout.trim()
      };
    } catch (error) {
      logger.error('Failed to enable UFW:', error);
      throw new Error('Failed to enable firewall');
    }
  }

  /**
   * Disable UFW
   */
  async disable() {
    try {
      const { stdout } = await execAsync('echo "y" | ufw disable');
      
      this.enabled = false;
      logger.info('UFW disabled');
      
      return {
        success: true,
        message: 'Firewall disabled successfully',
        output: stdout.trim()
      };
    } catch (error) {
      logger.error('Failed to disable UFW:', error);
      throw new Error('Failed to disable firewall');
    }
  }

  /**
   * Reset UFW
   */
  async reset() {
    try {
      const { stdout } = await execAsync('echo "y" | ufw reset');
      
      logger.info('UFW reset');
      
      return {
        success: true,
        message: 'Firewall reset successfully',
        output: stdout.trim()
      };
    } catch (error) {
      logger.error('Failed to reset UFW:', error);
      throw new Error('Failed to reset firewall');
    }
  }

  /**
   * Set default policy
   */
  async setDefault(direction, policy) {
    try {
      const { stdout } = await execAsync(`ufw default ${policy} ${direction}`);
      
      logger.info(`UFW default ${direction} policy set to ${policy}`);
      
      return {
        success: true,
        message: `Default ${direction} policy set to ${policy}`,
        output: stdout.trim()
      };
    } catch (error) {
      logger.error('Failed to set UFW default policy:', error);
      throw new Error('Failed to set default policy');
    }
  }

  /**
   * Apply department firewall rules
   */
  async applyDepartmentRules(rules) {
    const results = [];
    
    for (const rule of rules) {
      try {
        const result = await this.addRule({
          action: rule.action,
          direction: rule.direction,
          protocol: rule.protocol,
          port: rule.port,
          sourceIP: rule.source_ip,
          destinationIP: rule.destination_ip
        });
        
        results.push({
          ruleId: rule.id,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          ruleId: rule.id,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Get rule by number
   */
  async getRuleByNumber(ruleNumber) {
    const status = await this.getStatus();
    return status.rules.find(r => r.number === ruleNumber);
  }

  /**
   * Insert rule at specific position
   */
  async insertRule(rule, position) {
    const {
      action = 'allow',
      direction = 'in',
      protocol = 'tcp',
      port,
      sourceIP,
      destinationIP
    } = rule;

    try {
      let command = `ufw insert ${position} ${action}`;

      if (direction && direction !== 'in') {
        command += ` ${direction}`;
      }

      if (protocol && protocol !== 'any') {
        command += ` proto ${protocol}`;
      }

      if (sourceIP) {
        command += ` from ${sourceIP}`;
      } else {
        command += ' from any';
      }

      if (destinationIP) {
        command += ` to ${destinationIP}`;
      }

      if (port) {
        command += ` port ${port}`;
      }

      const { stdout } = await execAsync(`echo "y" | ${command}`);

      logger.info(`UFW rule inserted at ${position}: ${command}`);

      return {
        success: true,
        message: 'Rule inserted successfully',
        output: stdout.trim()
      };
    } catch (error) {
      logger.error('Failed to insert UFW rule:', error);
      throw new Error(`Failed to insert firewall rule: ${error.message}`);
    }
  }
}

module.exports = new UFWService();
