/**
 * Audit Log Routes
 */

const express = require('express');
const router = express.Router();
const { AuditLog } = require('../database/models');
const authMiddleware = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const logger = require('../utils/logger');

router.use(authMiddleware);

/**
 * GET /api/audit
 * List audit logs (Admin only)
 */
router.get('/', authorize('audit:view'), async (req, res) => {
  try {
    const {
      action,
      entity_type,
      user_id,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};
    if (action) where.action = action;
    if (entity_type) where.entity_type = entity_type;
    if (user_id) where.user_id = user_id;
    if (status) where.status = status;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.$gte = new Date(start_date);
      if (end_date) where.created_at.$lte = new Date(end_date);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{
        model: 'User',
        as: 'user',
        attributes: ['id', 'email', 'full_name']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs'
    });
  }
});

/**
 * GET /api/audit/stats
 * Get audit log statistics
 */
router.get('/stats', authorize('audit:view'), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const where = {};
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.$gte = new Date(start_date);
      if (end_date) where.created_at.$lte = new Date(end_date);
    }

    const totalLogs = await AuditLog.count({ where });
    const successLogs = await AuditLog.count({ where: { ...where, status: 'success' } });
    const failureLogs = await AuditLog.count({ where: { ...where, status: 'failure' } });

    // Get action breakdown
    const actionBreakdown = await AuditLog.findAll({
      where,
      attributes: [
        'action',
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('action')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    // Get entity type breakdown
    const entityBreakdown = await AuditLog.findAll({
      where,
      attributes: [
        'entity_type',
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('entity_type')), 'count']
      ],
      group: ['entity_type'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total: totalLogs,
        success: successLogs,
        failure: failureLogs,
        actions: actionBreakdown,
        entities: entityBreakdown
      }
    });
  } catch (error) {
    logger.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit statistics'
    });
  }
});

/**
 * GET /api/audit/:id
 * Get audit log by ID
 */
router.get('/:id', authorize('audit:view'), async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id, {
      include: [{
        model: 'User',
        as: 'user',
        attributes: ['id', 'email', 'full_name']
      }]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    logger.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit log'
    });
  }
});

/**
 * DELETE /api/audit/clear
 * Clear audit logs older than retention period
 */
router.delete('/clear', authorize('audit:view'), async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const { count } = await AuditLog.destroy({
      where: {
        created_at: {
          $lt: cutoffDate
        }
      }
    });

    res.json({
      success: true,
      message: `Cleared ${count} audit logs older than ${days} days`
    });
  } catch (error) {
    logger.error('Clear audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear audit logs'
    });
  }
});

module.exports = router;
