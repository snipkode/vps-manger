/**
 * System Monitoring Routes
 */

const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoring.service');
const authMiddleware = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { logAction } = require('../utils/auditLogger');
const logger = require('../utils/logger');

router.use(authMiddleware);

/**
 * GET /api/monitoring
 * Get complete system overview
 */
router.get('/', authorize('monitoring:view'), async (req, res) => {
  try {
    const overview = await monitoringService.getSystemOverview();
    
    await logAction({
      action: 'READ',
      entityType: 'System',
      user: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Viewed system monitoring overview',
      status: 'success'
    });

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    logger.error('Get monitoring overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system monitoring data',
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/cpu
 * Get CPU information
 */
router.get('/cpu', authorize('monitoring:view'), async (req, res) => {
  try {
    const cpuInfo = await monitoringService.getCPUInfo();
    res.json({
      success: true,
      data: cpuInfo
    });
  } catch (error) {
    logger.error('Get CPU info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get CPU information',
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/memory
 * Get Memory information
 */
router.get('/memory', authorize('monitoring:view'), async (req, res) => {
  try {
    const memoryInfo = await monitoringService.getMemoryInfo();
    res.json({
      success: true,
      data: memoryInfo
    });
  } catch (error) {
    logger.error('Get memory info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get memory information',
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/disk
 * Get Disk information
 */
router.get('/disk', authorize('monitoring:view'), async (req, res) => {
  try {
    const diskInfo = await monitoringService.getDiskInfo();
    res.json({
      success: true,
      data: diskInfo
    });
  } catch (error) {
    logger.error('Get disk info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get disk information',
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/network
 * Get Network information
 */
router.get('/network', authorize('monitoring:view'), async (req, res) => {
  try {
    const networkInfo = await monitoringService.getNetworkInfo();
    res.json({
      success: true,
      data: networkInfo
    });
  } catch (error) {
    logger.error('Get network info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get network information',
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/os
 * Get OS information
 */
router.get('/os', authorize('monitoring:view'), async (req, res) => {
  try {
    const osInfo = await monitoringService.getOSInfo();
    res.json({
      success: true,
      data: osInfo
    });
  } catch (error) {
    logger.error('Get OS info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OS information',
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/wireguard
 * Get WireGuard statistics
 */
router.get('/wireguard', authorize('monitoring:view'), async (req, res) => {
  try {
    const wgStats = await monitoringService.getWireGuardStats();
    res.json({
      success: true,
      data: wgStats
    });
  } catch (error) {
    logger.error('Get WireGuard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get WireGuard statistics',
      error: error.message
    });
  }
});

module.exports = router;
