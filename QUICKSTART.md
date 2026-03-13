# Quick Start Guide - VPS Manager

> **Version:** v1.0.0 (Production Release)

## ✅ Instalasi Selesai!

Aplikasi VPS Manager untuk WireGuard & Firewall Management dengan RBAC sudah siap digunakan.

## 📍 Status Instalasi

- ✅ Backend dependencies installed
- ✅ Frontend built successfully (production build)
- ✅ Database seeded dengan 6 departments + 1 admin user
- ✅ Server running in production mode
- ✅ Eruda debugger hidden (production security)

## 🚀 Cara Menjalankan

### Mode Development (Auto-reload)
```bash
cd /root/vps-manager
npm run dev
```

### Mode Production
```bash
cd /root/vps-manager
npm start
```

### Dengan Systemd (Recommended untuk Production)
```bash
# Copy service file
cp /root/vps-manager/vps-manager.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Start service
systemctl start vps-manager

# Enable on boot
systemctl enable vps-manager

# Check status
systemctl status vps-manager
```

### Dengan PM2 (Alternative)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start /root/vps-manager/src/server.js --name vps-manager

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

## 🔐 Login Credentials

```
URL: http://localhost:3000
Email: admin@vps-manager.local
Password: Admin123!
```

**⚠️ PENTING:** Ganti password setelah login pertama kali!

## 📋 Default Departments

1. **IT** (IT) - 10.0.1.0/24
2. **Keuangan** (FINANCE) - 10.0.2.0/24
3. **Akuntansi** (ACCOUNTING) - 10.0.3.0/24
4. **HR** (HR) - 10.0.4.0/24
5. **Marketing** (MARKETING) - 10.0.5.0/24
6. **Operations** (OPS) - 10.0.6.0/24

## 🔧 Konfigurasi

Edit file `/root/vps-manager/.env`:

```bash
# Ganti JWT Secret dengan random string
JWT_SECRET=your-random-secret-key-here

# Ganti password default
DEFAULT_ADMIN_PASSWORD=YourStrongPassword123!

# Sesuaikan WireGuard settings
WG_INTERFACE_PORT=51820
WG_SERVER_ENDPOINT=your-server-public-ip:51820
```

## 🛡️ Firewall Setup

Jika UFW belum aktif:

```bash
# Allow SSH (penting!)
ufw allow 22/tcp

# Allow WireGuard
ufw allow 51820/udp

# Allow VPS Manager
ufw allow 3000/tcp

# Enable UFW
ufw enable
```

## 📖 API Endpoints

Setelah server running, akses:
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health

Full API documentation tersedia di README.md

## 🎯 Fitur yang Tersedia

### ✅ WireGuard Management
- Create/Edit/Delete peers
- Download konfigurasi client (.conf)
- Auto IP allocation
- Peer status monitoring
- Sync ke WireGuard interface

### ✅ Firewall Rules (UFW)
- Rules by department
- Support: allow, deny, reject, limit
- Protocol: TCP, UDP, ICMP
- Port & port range
- Bulk apply rules

### ✅ System Monitoring
- CPU, Memory, Disk usage
- Network statistics
- OS information

### ✅ RBAC (Role-Based Access Control)
- Super Admin: Full access
- Admin: Manage peers, firewall, users
- Department Head: Manage department resources
- User: View own peer only

### ✅ Audit Trail
- Log semua aktivitas user
- Login/logout tracking
- Command execution logs

## 📁 Struktur Direktori

```
/root/vps-manager/
├── src/                  # Backend source code
├── client/build/         # Frontend build
├── data/                 # SQLite database
├── logs/                 # Application logs
├── .env                  # Environment config
└── package.json          # Dependencies
```

## 🔍 Troubleshooting

### Port 3000 sudah digunakan
```bash
# Cari proses yang menggunakan port 3000
lsof -i :3000

# Kill proses
kill -9 <PID>
```

### Database error
```bash
# Reset database
rm data/vps-manager.db
npm run seed
```

### Permission error
```bash
# Jalankan sebagai root atau dengan sudo
sudo npm start
```

## 📦 Release Notes - v1.0.0

**Production Release Features:**
- WireGuard Peer Management (CRUD + config download)
- Firewall Rules (UFW) with bulk apply
- System Monitoring (CPU, Memory, Disk, Network)
- Audit Logs with filtering and statistics
- RBAC with 4 roles
- Department Management
- User Management

**Security Updates:**
- Eruda debugger hidden by default
- Access via browser console: `localStorage.setItem('eruda-active', 'true');` then refresh

**Bug Fixes:**
- UFW command syntax fixed
- Monitoring service API fixed (systeminformation v5.x)
- WireGuardPeer-Department association fixed
- Audit Logs User model include fixed
- LinearProgress value prop type fixed
- AuditLogs date formatting fixed

## 📞 Support

Untuk pertanyaan atau issue, silakan buat issue di repository ini.

---

**VPS Manager v1.0.0** - WireGuard & Firewall Management with RBAC

🔗 GitHub Release: https://github.com/snipkode/vps-manger/releases/tag/v1.0.0
