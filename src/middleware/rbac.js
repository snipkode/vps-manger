/**
 * RBAC Authorization Middleware
 * Check if user has required permissions
 */

const { User } = require('../database/models');
const logger = require('../utils/logger');
const { logAction } = require('../utils/auditLogger');

/**
 * Check if user has permission
 * @param {string|string[]} permissions - Permission(s) to check
 * @returns {Function} Express middleware
 */
const authorize = (permissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Convert single permission to array
      const permissionList = Array.isArray(permissions) ? permissions : [permissions];

      // Check if user has any of the required permissions
      const hasPermission = permissionList.some(permission => 
        user.hasPermission(permission)
      );

      if (!hasPermission) {
        // Log unauthorized access attempt
        await logAction({
          action: 'READ',
          entityType: 'System',
          user,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          description: `Unauthorized access attempt to ${req.path}`,
          requestData: { permissions: permissionList },
          status: 'failure',
          errorMessage: 'Insufficient permissions'
        });

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to perform this action.'
        });
      }

      next();
    } catch (error) {
      logger.error('Authorize middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error.'
      });
    }
  };
};

/**
 * Check if user has specific role
 * @param {string|string[]} roles - Role(s) to check
 * @returns {Function} Express middleware
 */
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const roleList = Array.isArray(roles) ? roles : [roles];

      if (!roleList.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `This action requires one of the following roles: ${roleList.join(', ')}`
        });
      }

      next();
    } catch (error) {
      logger.error('RequireRole middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error.'
      });
    }
  };
};

/**
 * Check if user owns or manages the resource
 * For department_head and user roles
 */
const requireOwnership = (model, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const resourceId = req.params[idParam];

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Super admin and admin bypass ownership check
      if (['super_admin', 'admin'].includes(user.role)) {
        return next();
      }

      const resource = await model.findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.'
        });
      }

      // Check ownership or department membership
      const isOwner = resource.owner_id === user.id;
      const isDepartmentMember = resource.department_id === user.department_id;
      const isDepartmentHead = user.role === 'department_head' && isDepartmentMember;

      if (!isOwner && !isDepartmentHead) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own resources.'
        });
      }

      // Attach resource to request for later use
      req.resource = resource;
      next();
    } catch (error) {
      logger.error('RequireOwnership middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error.'
      });
    }
  };
};

module.exports = { authorize, requireRole, requireOwnership };
