/**
 * Department Management Routes
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Department, User, FirewallRule } = require('../database/models');
const authMiddleware = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { logAction } = require('../utils/auditLogger');
const logger = require('../utils/logger');

router.use(authMiddleware);

/**
 * GET /api/departments
 * List all departments
 */
router.get('/', authorize('monitoring:view'), async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'email', 'full_name', 'role']
        },
        {
          model: FirewallRule,
          as: 'firewall_rules',
          attributes: ['id', 'name', 'action', 'protocol', 'port', 'is_active']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get departments'
    });
  }
});

/**
 * GET /api/departments/:id
 * Get department by ID
 */
router.get('/:id', authorize('monitoring:view'), async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'email', 'full_name', 'role']
        },
        {
          model: FirewallRule,
          as: 'firewall_rules'
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    logger.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department'
    });
  }
});

/**
 * POST /api/departments
 * Create new department
 */
router.post('/', authorize(['firewall:create']), [
  body('name').notEmpty().trim().isLength({ min: 2, max: 100 }),
  body('code').notEmpty().trim().isLength({ min: 2, max: 20 }),
  body('description').optional().trim(),
  body('network_range').optional(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, code, description, network_range, is_active } = req.body;

    // Check if code already exists
    const existing = await Department.findOne({ where: { code } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Department code already exists'
      });
    }

    const department = await Department.create({
      name,
      code,
      description,
      network_range,
      is_active,
      created_by: req.user.id
    });

    await logAction({
      action: 'CREATE',
      entityType: 'Department',
      entity_id: department.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Created department ${department.name} (${department.code})`,
      requestData: { name, code, network_range },
      status: 'success'
    });

    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    logger.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department'
    });
  }
});

/**
 * PUT /api/departments/:id
 * Update department
 */
router.put('/:id', authorize(['firewall:edit']), [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('code').optional().trim().isLength({ min: 2, max: 20 }),
  body('description').optional().trim(),
  body('network_range').optional(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const { name, code, description, network_range, is_active } = req.body;

    // Check code uniqueness if changing
    if (code && code !== department.code) {
      const existing = await Department.findOne({ where: { code } });
      if (existing && existing.id !== department.id) {
        return res.status(409).json({
          success: false,
          message: 'Department code already exists'
        });
      }
    }

    await department.update({
      name,
      code,
      description,
      network_range,
      is_active,
      updated_by: req.user.id
    });

    await logAction({
      action: 'UPDATE',
      entityType: 'Department',
      entity_id: department.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Updated department ${department.name}`,
      requestData: { name, code, network_range, is_active },
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Department updated successfully'
    });
  } catch (error) {
    logger.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department'
    });
  }
});

/**
 * DELETE /api/departments/:id
 * Delete department
 */
router.delete('/:id', authorize('firewall:delete'), async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has users
    const userCount = await department.countUsers();
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with ${userCount} user(s). Reassign users first.`
      });
    }

    await department.destroy();

    await logAction({
      action: 'DELETE',
      entityType: 'Department',
      entity_id: department.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Deleted department ${department.name}`,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    logger.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department'
    });
  }
});

module.exports = router;
