/**
 * Firewall Rules Management Routes
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { FirewallRule, WireGuardPeer, Department } = require('../database/models');
const ufwService = require('../services/ufw.service');
const authMiddleware = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { logAction } = require('../utils/auditLogger');
const logger = require('../utils/logger');

router.use(authMiddleware);

/**
 * GET /api/firewall
 * List all firewall rules
 */
router.get('/', authorize('firewall:view'), async (req, res) => {
  try {
    const { department_id, peer_id, is_active, applied } = req.query;
    
    const where = {};
    if (department_id) where.department_id = department_id;
    if (peer_id) where.peer_id = peer_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (applied !== undefined) where.applied = applied === 'true';

    // Department heads can only see their department's rules
    if (req.user.role === 'department_head') {
      where.department_id = req.user.department_id;
    }

    const rules = await FirewallRule.findAll({
      where,
      include: [
        { model: WireGuardPeer, as: 'peer', attributes: ['id', 'name', 'ip_address'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
      ],
      order: [['priority', 'ASC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    logger.error('Get firewall rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get firewall rules'
    });
  }
});

/**
 * GET /api/firewall/ufw-status
 * Get UFW status from system
 */
router.get('/ufw-status', authorize('firewall:view'), async (req, res) => {
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
 * POST /api/firewall
 * Create new firewall rule
 */
router.post('/', authorize('firewall:create'), [
  body('name').notEmpty().trim().isLength({ min: 2, max: 100 }),
  body('action').isIn(['allow', 'deny', 'reject', 'limit']),
  body('direction').optional().isIn(['in', 'out']),
  body('protocol').optional().isIn(['tcp', 'udp', 'icmp', 'any']),
  body('port').optional(),
  body('source_ip').optional(),
  body('destination_ip').optional(),
  body('peer_id').optional().isInt(),
  body('department_id').optional().isInt(),
  body('priority').optional().isInt(),
  body('auto_apply').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      action,
      direction,
      protocol,
      port,
      source_ip,
      destination_ip,
      peer_id,
      department_id,
      priority,
      auto_apply
    } = req.body;

    const rule = await FirewallRule.create({
      name,
      action,
      direction,
      protocol,
      port,
      source_ip,
      destination_ip,
      peer_id,
      department_id: department_id || req.user.department_id,
      priority: priority || 100,
      is_active: true,
      applied: false,
      created_by: req.user.id
    });

    // Auto-apply to UFW if requested
    if (auto_apply) {
      try {
        await ufwService.addRule({
          action,
          direction,
          protocol,
          port,
          sourceIP: source_ip,
          destinationIP: destination_ip
        });
        
        rule.applied = true;
        rule.applied_at = new Date();
        await rule.save();
      } catch (ufwError) {
        logger.warn('Failed to auto-apply rule to UFW:', ufwError);
      }
    }

    await logAction({
      action: 'CREATE',
      entityType: 'FirewallRule',
      entity_id: rule.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Created firewall rule ${rule.name}`,
      requestData: { name, action, protocol, port },
      status: 'success'
    });

    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    logger.error('Create firewall rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create firewall rule'
    });
  }
});

/**
 * PUT /api/firewall/:id
 * Update firewall rule
 */
router.put('/:id', authorize('firewall:edit'), [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('action').optional().isIn(['allow', 'deny', 'reject', 'limit']),
  body('direction').optional().isIn(['in', 'out']),
  body('protocol').optional().isIn(['tcp', 'udp', 'icmp', 'any']),
  body('port').optional(),
  body('source_ip').optional(),
  body('destination_ip').optional(),
  body('priority').optional().isInt(),
  body('is_active').optional().isBoolean(),
  body('auto_apply').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const rule = await FirewallRule.findByPk(req.params.id, {
      include: [{ model: WireGuardPeer, as: 'peer' }]
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Rule not found'
      });
    }

    const {
      name,
      action,
      direction,
      protocol,
      port,
      source_ip,
      destination_ip,
      priority,
      is_active,
      auto_apply
    } = req.body;

    await rule.update({
      name,
      action,
      direction,
      protocol,
      port,
      source_ip,
      destination_ip,
      priority,
      is_active,
      updated_by: req.user.id
    });

    // Auto-apply changes to UFW
    if (auto_apply && rule.applied) {
      try {
        // Delete old rule and add new one
        if (rule.ufw_rule_number) {
          await ufwService.deleteRule(rule.ufw_rule_number);
        }
        
        const result = await ufwService.addRule({
          action: rule.action,
          direction: rule.direction,
          protocol: rule.protocol,
          port: rule.port,
          sourceIP: rule.source_ip,
          destinationIP: rule.destination_ip
        });

        rule.applied = true;
        rule.applied_at = new Date();
        await rule.save();
      } catch (ufwError) {
        logger.warn('Failed to auto-apply rule changes:', ufwError);
      }
    }

    await logAction({
      action: 'UPDATE',
      entityType: 'FirewallRule',
      entity_id: rule.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Updated firewall rule ${rule.name}`,
      requestData: { name, action, protocol, port, is_active },
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Firewall rule updated successfully'
    });
  } catch (error) {
    logger.error('Update firewall rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update firewall rule'
    });
  }
});

/**
 * DELETE /api/firewall/:id
 * Delete firewall rule
 */
router.delete('/:id', authorize('firewall:delete'), async (req, res) => {
  try {
    const rule = await FirewallRule.findByPk(req.params.id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Rule not found'
      });
    }

    // Remove from UFW if applied
    if (rule.applied && rule.ufw_rule_number) {
      try {
        await ufwService.deleteRule(rule.ufw_rule_number);
      } catch (ufwError) {
        logger.warn('Failed to delete rule from UFW:', ufwError);
      }
    }

    await rule.destroy();

    await logAction({
      action: 'DELETE',
      entityType: 'FirewallRule',
      entity_id: rule.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Deleted firewall rule ${rule.name}`,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Firewall rule deleted successfully'
    });
  } catch (error) {
    logger.error('Delete firewall rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete firewall rule'
    });
  }
});

/**
 * POST /api/firewall/:id/apply
 * Apply rule to UFW
 */
router.post('/:id/apply', authorize('firewall:edit'), async (req, res) => {
  try {
    const rule = await FirewallRule.findByPk(req.params.id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Rule not found'
      });
    }

    if (!rule.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply inactive rule'
      });
    }

    const result = await ufwService.addRule({
      action: rule.action,
      direction: rule.direction,
      protocol: rule.protocol,
      port: rule.port,
      sourceIP: rule.source_ip,
      destinationIP: rule.destination_ip
    });

    rule.applied = true;
    rule.applied_at = new Date();
    await rule.save();

    await logAction({
      action: 'EXECUTE',
      entityType: 'FirewallRule',
      entity_id: rule.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Applied firewall rule ${rule.name} to UFW`,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Rule applied to UFW successfully',
      data: result
    });
  } catch (error) {
    logger.error('Apply firewall rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply rule to UFW',
      error: error.message
    });
  }
});

/**
 * POST /api/firewall/bulk-apply
 * Apply all pending rules for a department
 */
router.post('/bulk-apply', authorize('firewall:edit'), async (req, res) => {
  try {
    const { department_id } = req.body;
    
    const where = { applied: false, is_active: true };
    if (department_id) {
      where.department_id = department_id;
    } else if (req.user.role === 'department_head') {
      where.department_id = req.user.department_id;
    }

    const rules = await FirewallRule.findAll({ where });

    if (rules.length === 0) {
      return res.json({
        success: true,
        message: 'No pending rules to apply',
        data: { applied: 0 }
      });
    }

    const results = await ufwService.applyDepartmentRules(rules);
    
    const successCount = results.filter(r => r.success).length;

    // Update applied status
    for (const result of results) {
      if (result.success) {
        const rule = await FirewallRule.findByPk(result.ruleId);
        if (rule) {
          rule.applied = true;
          rule.applied_at = new Date();
          await rule.save();
        }
      }
    }

    await logAction({
      action: 'EXECUTE',
      entityType: 'FirewallRule',
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Bulk applied ${successCount}/${rules.length} firewall rules`,
      status: 'success'
    });

    res.json({
      success: true,
      message: `Applied ${successCount}/${rules.length} rules to UFW`,
      data: {
        total: rules.length,
        applied: successCount,
        failed: rules.length - successCount,
        results
      }
    });
  } catch (error) {
    logger.error('Bulk apply firewall rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply firewall rules',
      error: error.message
    });
  }
});

module.exports = router;
