/**
 * User Management Routes
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { User, Department } = require('../database/models');
const authMiddleware = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { logAction } = require('../utils/auditLogger');
const logger = require('../utils/logger');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/users
 * List all users (Admin only)
 */
router.get('/', authorize('monitoring:view'), async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code']
      }],
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authorize('monitoring:view'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code']
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
});

/**
 * POST /api/users
 * Create new user
 */
router.post('/', authorize(['wireguard:create', 'firewall:create']), [
  body('email').isEmail().normalizeEmail(),
  body('full_name').notEmpty().trim(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['super_admin', 'admin', 'department_head', 'user']),
  body('department_id').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, full_name, password, role, department_id, phone } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      full_name,
      password,
      role,
      department_id,
      phone,
      created_by: req.user.id
    });

    await logAction({
      action: 'CREATE',
      entityType: 'User',
      entity_id: user.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Created user ${user.email}`,
      requestData: { email, full_name, role, department_id },
      status: 'success'
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department_id: user.department_id
      }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', authorize(['wireguard:edit', 'firewall:edit']), [
  body('email').optional().isEmail().normalizeEmail(),
  body('full_name').optional().trim(),
  body('password').optional().isLength({ min: 8 }),
  body('role').optional().isIn(['super_admin', 'admin', 'department_head', 'user']),
  body('department_id').optional().isInt(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { email, full_name, password, role, department_id, phone, is_active } = req.body;

    // Check email uniqueness if changing
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    await user.update({
      email: email ? email.toLowerCase() : undefined,
      full_name,
      password,
      role,
      department_id,
      phone,
      is_active,
      updated_by: req.user.id
    });

    await logAction({
      action: 'UPDATE',
      entityType: 'User',
      entity_id: user.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Updated user ${user.email}`,
      requestData: { email, full_name, role, department_id, is_active },
      status: 'success'
    });

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/:id', authorize('wireguard:delete'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.destroy();

    await logAction({
      action: 'DELETE',
      entityType: 'User',
      entity_id: user.id,
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Deleted user ${user.email}`,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;
