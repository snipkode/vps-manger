/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User, Department } = require('../database/models');
const authMiddleware = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');
const logger = require('../utils/logger');

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }]
    });

    if (!user || !user.is_active) {
      await logAction({
        action: 'LOGIN',
        entityType: 'System',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        description: `Failed login attempt for ${email}`,
        requestData: { email },
        status: 'failure',
        errorMessage: 'User not found or inactive'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValid = await user.comparePassword(password);

    if (!isValid) {
      await logAction({
        action: 'LOGIN',
        entityType: 'System',
        user,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        description: `Failed login attempt for ${email}`,
        requestData: { email },
        status: 'failure',
        errorMessage: 'Invalid password'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Update last login
    user.last_login = new Date();
    await user.save();

    await logAction({
      action: 'LOGIN',
      entityType: 'System',
      user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `User ${user.email} logged in successfully`,
      status: 'success'
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          department: user.department,
          is_active: user.is_active
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await logAction({
      action: 'LOGOUT',
      entityType: 'System',
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `User ${req.user.email} logged out`,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user info'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change password
 */
router.post('/change-password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    await logAction({
      action: 'UPDATE',
      entityType: 'User',
      entity_id: user.id,
      user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: `User ${user.email} changed password`,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

module.exports = router;
