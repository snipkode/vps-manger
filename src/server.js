#!/usr/bin/env node

/**
 * VPS Manager - Main Server Entry Point
 * WireGuard & Firewall Management with RBAC
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { sequelize } = require('./database');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');
const peerRoutes = require('./routes/peer.routes');
const firewallRoutes = require('./routes/firewall.routes');
const monitoringRoutes = require('./routes/monitoring.routes');
const auditRoutes = require('./routes/audit.routes');
const systemRoutes = require('./routes/system.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for React frontend
app.use(express.static(path.join(__dirname, '../client/build')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/peers', peerRoutes);
app.use('/api/firewall', firewallRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/system', systemRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');

    // Sync database models
    await sequelize.sync();
    logger.info('✅ Database models synchronized.');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 VPS Manager server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
