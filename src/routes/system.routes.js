/**
 * System Management Routes
 * For executing system-level commands (wg, ufw)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const wireguardService = require('../services/wireguard.service');
const ufwService = require('../services/ufw.service');
const authMiddleware = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { logAction } = require('../utils/auditLogger');
const logger = require('../utils/logger');

router.use(authMiddleware);

/**
 * POST /api/system/wireguard/restart
 * Restart WireGuard interface
 */
router.post('/wireguard/restart', authorize('system:execute'), async (req, res) => {
  try {
    await wireguardService.restartInterface();

    await logAction({
      action: 'EXECUTE',
      entityType: 'System',
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Restarted WireGuard interface',
      status: 'success'
    });

    res.json({
      success: true,
      message: 'WireGuard interface restarted successfully'
    });
  } catch (error) {
    logger.error('Restart WireGuard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restart WireGuard',
      error: error.message
    });
  }
});

/**
 * POST /api/system/wireguard/start
 * Start WireGuard interface
 */
router.post('/wireguard/start', authorize('system:execute'), async (req, res) => {
  try {
    await wireguardService.startInterface();

    await logAction({
      action: 'EXECUTE',
      entityType: 'System',
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Started WireGuard interface',
      status: 'success'
    });

    res.json({
      success: true,
      message: 'WireGuard interface started successfully'
    });
  } catch (error) {
    logger.error('Start WireGuard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start WireGuard',
      error: error.message
    });
  }
});

/**
 * POST /api/system/wireguard/stop
 * Stop WireGuard interface
 */
router.post('/wireguard/stop', authorize('system:execute'), async (req, res) => {
  try {
    await wireguardService.stopInterface();

    await logAction({
      action: 'EXECUTE',
      entityType: 'System',
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Stopped WireGuard interface',
      status: 'success'
    });

    res.json({
      success: true,
      message: 'WireGuard interface stopped successfully'
    });
  } catch (error) {
    logger.error('Stop WireGuard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop WireGuard',
      error: error.message
    });
  }
});

/**
 * GET /api/system/wireguard/status
 * Get WireGuard interface status
 */
router.get('/wireguard/status', authorize('system:execute'), async (req, res) => {
  try {
    const status = await wireguardService.getInterfaceStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Get WireGuard status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get WireGuard status',
      error: error.message
    });
  }
});

/**
 * POST /api/system/ufw/enable
 * Enable UFW
 */
router.post('/ufw/enable', authorize('system:execute'), async (req, res) => {
  try {
    const result = await ufwService.enable();

    await logAction({
      action: 'EXECUTE',
      entityType: 'System',
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Enabled UFW firewall',
      status: 'success'
    });

    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    logger.error('Enable UFW error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable UFW',
      error: error.message
    });
  }
});

/**
 * POST /api/system/ufw/disable
 * Disable UFW
 */
router.post('/ufw/disable', authorize('system:execute'), async (req, res) => {
  try {
    const result = await ufwService.disable();

    await logAction({
      action: 'EXECUTE',
      entityType: 'System',
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Disabled UFW firewall',
      status: 'success'
    });

    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    logger.error('Disable UFW error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable UFW',
      error: error.message
    });
  }
});

/**
 * POST /api/system/ufw/reset
 * Reset UFW
 */
router.post('/ufw/reset', authorize('system:execute'), async (req, res) => {
  try {
    const result = await ufwService.reset();

    await logAction({
      action: 'EXECUTE',
      entityType: 'System',
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Reset UFW firewall',
      status: 'success'
    });

    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    logger.error('Reset UFW error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset UFW',
      error: error.message
    });
  }
});

/**
 * GET /api/system/ufw/status
 * Get UFW status
 */
router.get('/ufw/status', authorize('system:execute'), async (req, res) => {
  try {
    const status = await ufwService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Get UFW status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get UFW status',
      error: error.message
    });
  }
});

/**
 * POST /api/system/ufw/rule
 * Execute UFW command directly
 */
router.post('/ufw/rule', authorize('system:execute'), [
  body('action').isIn(['allow', 'deny', 'reject', 'limit']),
  body('direction').optional().isIn(['in', 'out']),
  body('protocol').optional().isIn(['tcp', 'udp', 'icmp', 'any']),
  body('port').optional(),
  body('source_ip').optional(),
  body('destination_ip').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { action, direction, protocol, port, source_ip, destination_ip } = req.body;

    const result = await ufwService.addRule({
      action,
      direction,
      protocol,
      port,
      sourceIP: source_ip,
      destinationIP: destination_ip
    });

    await logAction({
      action: 'EXECUTE',
      entityType: 'System',
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Executed UFW rule: ${action} ${direction} ${protocol} ${port}`,
      requestData: { action, direction, protocol, port, source_ip, destination_ip },
      status: 'success'
    });

    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    logger.error('Execute UFW rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute UFW rule',
      error: error.message
    });
  }
});

module.exports = router;
