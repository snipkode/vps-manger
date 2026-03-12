/**
 * WireGuard Peer Management Routes
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { WireGuardPeer, User, Department, FirewallRule } = require('../database/models');
const wireguardService = require('../services/wireguard.service');
const authMiddleware = require('../middleware/auth');
const { authorize, requireRole } = require('../middleware/rbac');
const { logAction } = require('../utils/auditLogger');
const logger = require('../utils/logger');

router.use(authMiddleware);

/**
 * GET /api/peers
 * List all WireGuard peers
 */
router.get('/', authorize('wireguard:view'), async (req, res) => {
  try {
    const { status, department_id, owner_id } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (department_id) where.department_id = department_id;
    if (owner_id) where.owner_id = owner_id;

    // Department heads can only see their department's peers
    if (req.user.role === 'department_head') {
      where.department_id = req.user.department_id;
    } else if (req.user.role === 'user') {
      where.owner_id = req.user.id;
    }

    const peers = await WireGuardPeer.findAll({
      where,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'email', 'full_name'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: FirewallRule, as: 'firewall_rules', attributes: ['id', 'name', 'action', 'port', 'is_active'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: peers
    });
  } catch (error) {
    logger.error('Get peers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get peers'
    });
  }
});

/**
 * GET /api/peers/:id
 * Get peer by ID
 */
router.get('/:id', authorize('wireguard:view'), async (req, res) => {
  try {
    const peer = await WireGuardPeer.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'email', 'full_name'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: FirewallRule, as: 'firewall_rules' }
      ]
    });

    if (!peer) {
      return res.status(404).json({
        success: false,
        message: 'Peer not found'
      });
    }

    // Check permissions
    if (req.user.role === 'user' && peer.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'department_head' && peer.department_id !== req.user.department_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: peer
    });
  } catch (error) {
    logger.error('Get peer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get peer'
    });
  }
});

/**
 * POST /api/peers
 * Create new WireGuard peer
 */
router.post('/', authorize('wireguard:create'), [
  body('name').notEmpty().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim(),
  body('department_id').optional().isInt(),
  body('owner_id').optional().isInt(),
  body('ip_address').optional().isIP(),
  body('expires_at').optional().isISO8601(),
  body('persistent_keepalive').optional().isInt({ min: 0, max: 65535 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, department_id, owner_id, ip_address, expires_at, persistent_keepalive } = req.body;

    // Get used IPs
    const existingPeers = await WireGuardPeer.findAll({ attributes: ['ip_address'] });
    const usedIPs = existingPeers.map(p => p.ip_address);

    // Generate or use provided IP
    const ipAddress = ip_address || await wireguardService.getNextAvailableIP(usedIPs);

    // Generate keys
    const keys = await wireguardService.generateKeys();

    const peer = await WireGuardPeer.create({
      name,
      description,
      public_key: keys.publicKey,
      private_key: keys.privateKey,
      preshared_key: keys.presharedKey,
      ip_address: ipAddress,
      allowed_ips: [`${ipAddress}/32`],
      persistent_keepalive: persistent_keepalive || 25,
      department_id: department_id || req.user.department_id,
      owner_id: owner_id || req.user.id,
      expires_at,
      status: 'active'
    });

    // Add to WireGuard config
    try {
      await wireguardService.addPeer(peer.toJSON());
    } catch (wgError) {
      logger.warn('Failed to add peer to WireGuard immediately:', wgError);
    }

    await logAction({
      action: 'CREATE',
      entityType: 'WireGuardPeer',
      entity_id: peer.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Created WireGuard peer ${peer.name} (${peer.ip_address})`,
      requestData: { name, ip_address: ipAddress, department_id },
      status: 'success'
    });

    res.status(201).json({
      success: true,
      data: peer
    });
  } catch (error) {
    logger.error('Create peer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create WireGuard peer',
      error: error.message
    });
  }
});

/**
 * PUT /api/peers/:id
 * Update peer
 */
router.put('/:id', authorize('wireguard:edit'), [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'expired', 'revoked']),
  body('expires_at').optional().isISO8601(),
  body('persistent_keepalive').optional().isInt({ min: 0, max: 65535 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const peer = await WireGuardPeer.findByPk(req.params.id);
    if (!peer) {
      return res.status(404).json({
        success: false,
        message: 'Peer not found'
      });
    }

    const { name, description, status, expires_at, persistent_keepalive } = req.body;

    await peer.update({
      name,
      description,
      status,
      expires_at,
      persistent_keepalive
    });

    await logAction({
      action: 'UPDATE',
      entityType: 'WireGuardPeer',
      entity_id: peer.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Updated WireGuard peer ${peer.name}`,
      requestData: { name, status, expires_at },
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Peer updated successfully'
    });
  } catch (error) {
    logger.error('Update peer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update peer'
    });
  }
});

/**
 * DELETE /api/peers/:id
 * Delete peer
 */
router.delete('/:id', authorize('wireguard:delete'), async (req, res) => {
  try {
    const peer = await WireGuardPeer.findByPk(req.params.id);
    if (!peer) {
      return res.status(404).json({
        success: false,
        message: 'Peer not found'
      });
    }

    // Remove from WireGuard
    try {
      await wireguardService.removePeer(peer.public_key);
    } catch (wgError) {
      logger.warn('Failed to remove peer from WireGuard:', wgError);
    }

    await peer.destroy();

    await logAction({
      action: 'DELETE',
      entityType: 'WireGuardPeer',
      entity_id: peer.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Deleted WireGuard peer ${peer.name}`,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Peer deleted successfully'
    });
  } catch (error) {
    logger.error('Delete peer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete peer'
    });
  }
});

/**
 * GET /api/peers/:id/config
 * Get peer configuration file
 */
router.get('/:id/config', authorize('wireguard:view'), async (req, res) => {
  try {
    const peer = await WireGuardPeer.findByPk(req.params.id, {
      include: [{ model: Department, as: 'department' }]
    });

    if (!peer) {
      return res.status(404).json({
        success: false,
        message: 'Peer not found'
      });
    }

    // Get server public key from WireGuard
    let serverPublicKey = process.env.WG_SERVER_PUBLIC_KEY || 'server-public-key';
    const serverEndpoint = process.env.WG_SERVER_ENDPOINT || 'your-server-ip:51820';

    try {
      const status = await wireguardService.getInterfaceStatus();
      if (status.active && status.publicKey) {
        serverPublicKey = status.publicKey;
      }
    } catch (error) {
      logger.warn('Failed to get server public key:', error);
    }

    const config = wireguardService.generatePeerConfig(peer.toJSON(), serverPublicKey, serverEndpoint);

    await logAction({
      action: 'READ',
      entityType: 'WireGuardPeer',
      entity_id: peer.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Downloaded config for peer ${peer.name}`,
      status: 'success'
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${peer.name}.conf"`);
    res.send(config);
  } catch (error) {
    logger.error('Get peer config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get peer config'
    });
  }
});

/**
 * POST /api/peers/sync
 * Sync all peers to WireGuard
 */
router.post('/sync', authorize('system:execute'), async (req, res) => {
  try {
    const peers = await WireGuardPeer.findAll({
      where: { status: 'active' }
    });

    const result = await wireguardService.syncPeers(peers.map(p => p.toJSON()));

    await logAction({
      action: 'EXECUTE',
      entityType: 'System',
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Synced ${peers.length} peers to WireGuard`,
      status: 'success'
    });

    res.json({
      success: true,
      message: `Synced ${peers.length} peers to WireGuard`,
      data: result
    });
  } catch (error) {
    logger.error('Sync peers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync peers',
      error: error.message
    });
  }
});

/**
 * GET /api/peers/status
 * Get WireGuard interface status
 */
router.get('/status/interface', authorize('wireguard:view'), async (req, res) => {
  try {
    const status = await wireguardService.getInterfaceStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Get interface status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interface status',
      error: error.message
    });
  }
});

module.exports = router;
