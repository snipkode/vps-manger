# VPS Manager v1.0.0 - Production Release

**Release Date:** March 13, 2026

## 🎉 Overview

First stable production release of VPS Manager - WireGuard & Firewall Management Panel with RBAC.

## ✨ Features

### WireGuard Management
- Create, read, update, delete WireGuard peers
- Generate client configuration files (.conf)
- Auto IP address allocation
- Peer status monitoring (handshake, traffic)
- Sync peers to WireGuard interface

### Firewall Management (UFW)
- Create firewall rules by department
- Support: allow, deny, reject, limit actions
- Protocol support: TCP, UDP, ICMP, Any
- Port and port range configuration
- Source/destination IP filtering
- Bulk apply rules to UFW

### System Monitoring
- Real-time CPU usage monitoring
- Memory usage with swap monitoring
- Disk usage per mount point
- Network interface statistics
- OS information and uptime

### RBAC (Role-Based Access Control)
| Role | Permissions |
|------|-------------|
| **super_admin** | Full access to all features |
| **admin** | Manage peers, firewall, users |
| **department_head** | Manage department peers & rules |
| **user** | View own peer, basic monitoring |

### Departments
- 6 default departments (IT, Keuangan, Akuntansi, HR, Marketing, Operations)
- Network range per department
- Department-based firewall rules

### Audit Trail
- Log all user actions
- Login/logout tracking
- Create, update, delete operations
- System command execution logs
- Filterable audit logs

## 🐛 Bug Fixes in v1.0.0

- Fixed UFW command syntax (`ufw allow proto tcp from any port X`)
- Fixed monitoring service API (systeminformation v5.x compatibility)
- Fixed WireGuardPeer-Department association
- Fixed Audit Logs User model include
- Fixed LinearProgress value prop type (MUI)
- Fixed AuditLogs date formatting (invalid date handling)

## 🔒 Security

- Eruda debugger hidden by default in production
- Access via browser console: `localStorage.setItem('eruda-active', 'true');` then refresh

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/snipkode/vps-manger.git
cd vps-manager

# Install dependencies
npm install
cd client && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Seed database
npm run seed

# Build frontend
cd client && npm run build && cd ..

# Start server
npm start
```

## 📖 Documentation

- [README.md](https://github.com/snipkode/vps-manger/blob/main/README.md) - Full documentation
- [QUICKSTART.md](https://github.com/snipkode/vps-manger/blob/main/QUICKSTART.md) - Quick start guide

## 🔗 Links

- [GitHub Repository](https://github.com/snipkode/vps-manger)
- [Issues](https://github.com/snipkode/vps-manger/issues)
- [v1.0.0 Tag](https://github.com/snipkode/vps-manger/releases/tag/v1.0.0)

---

**Full Changelog**: https://github.com/snipkode/vps-manger/commits/v1.0.0
