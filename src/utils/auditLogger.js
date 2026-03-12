/**
 * Audit Logger Helper
 * Log user actions to audit_logs table
 */

const { AuditLog } = require('../database/models');

const logAction = async (options) => {
  const {
    action,
    entityType,
    entityId,
    user,
    ipAddress,
    userAgent,
    description,
    requestData,
    responseData,
    status = 'success',
    errorMessage
  } = options;

  try {
    await AuditLog.create({
      action,
      entity_type: entityType,
      entity_id: entityId,
      user_id: user?.id || null,
      username: user?.email || 'system',
      ip_address: ipAddress,
      user_agent: userAgent,
      description,
      request_data: requestData,
      response_data: responseData,
      status,
      error_message: errorMessage
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

module.exports = { logAction };
