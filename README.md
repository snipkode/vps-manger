# VPS Manager - WireGuard & Firewall Management Panel

Aplikasi VPS Panel untuk mengelola WireGuard peers dan firewall dengan akses berbasis departemen (RBAC).

## 🚀 Fitur Utama

### WireGuard Management
- ✅ Create, read, update, delete WireGuard peers
- ✅ Generate konfigurasi client (.conf files)
- ✅ Auto IP address allocation
- ✅ Peer status monitoring (handshake, traffic)
- ✅ Sync peers ke WireGuard interface

### Firewall Management (UFW)
- ✅ Create firewall rules by department
- ✅ Support: allow, deny, reject, limit actions
- ✅ Protocol support: TCP, UDP, ICMP, Any
- ✅ Port dan port range configuration
- ✅ Source/destination IP filtering
- ✅ Bulk apply rules ke UFW

### System Monitoring
- ✅ Real-time CPU usage monitoring
- ✅ Memory usage dengan swap monitoring
- ✅ Disk usage per mount point
- ✅ Network interface statistics
- ✅ OS information dan uptime

### RBAC (Role-Based Access Control)
| Role | Permissions |
|------|-------------|
| **super_admin** | Full access ke semua fitur |
| **admin** | Manage peers, firewall, users |
| **department_head** | Manage department peers & rules |
| **user** | View own peer, basic monitoring |

### Departments
- IT, Keuangan, Akuntansi, HR, Marketing, Operations
- Network range per department
- Department-based firewall rules

### Audit Trail
- ✅ Log semua user actions
- ✅ Login/logout tracking
- ✅ Create, update, delete operations
- ✅ System command execution logs
- ✅ Filterable audit logs

## 📋 Tech Stack

```
Backend:
├── Node.js 18+
├── Express.js
├── SQLite (Sequelize ORM)
├── JWT Authentication
└── Winston Logger

Frontend:
├── React 18
├── Material UI (MUI)
├── React Router
├── Axios
└── Vite (Build tool)

System:
├── WireGuard (wg, wg-quick)
├── UFW Firewall
└── Linux System Commands
```

## 🛠️ Instalasi

### Prerequisites
- Node.js 18 atau lebih baru
- npm atau yarn
- WireGuard installed
- UFW installed
- Linux server (Ubuntu/Debian recommended)

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment

Copy `.env.example` ke `.env` dan sesuaikan:

```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-random-secret-key-here
WG_INTERFACE_NAME=wg0
WG_INTERFACE_PORT=51820
WG_SERVER_ENDPOINT=your-server-ip:51820
DEFAULT_ADMIN_PASSWORD=ChangeThisPassword123!
```

### 3. Seed Database

```bash
npm run seed
```

Ini akan membuat:
- 6 default departments (IT, Keuangan, Akuntansi, HR, Marketing, Operations)
- 1 admin user (admin@vps-manager.local / Admin123!)

### 4. Build Frontend

```bash
cd client
npm run build
cd ..
```

### 5. Start Server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## 🔐 Default Credentials

```
Email: admin@vps-manager.local
Password: Admin123!
```

**⚠️ PENTING:** Ganti password default setelah login pertama kali!

## 🔒 TLS/SSL Access

VPS Manager sekarang mendukung akses via TLS menggunakan stunnel:

| Access Type | URL | Port |
|-------------|-----|------|
| **HTTPS (TLS)** | `https://<IP-SERVER>:3443` | 3443 |
| HTTP (Local) | `http://localhost:3000` | 3000 |

### Stunnel Configuration

File konfigurasi: `/etc/stunnel/stunnel.conf`

```ini
pid = /var/run/stunnel4.pid

# Global certificate (Let's Encrypt)
cert = /etc/letsencrypt/live/perumdati.tech/fullchain.pem
key = /etc/letsencrypt/live/perumdati.tech/privkey.pem

socket = l:TCP_NODELAY=1
socket = r:TCP_NODELAY=1

# VPS Manager - Port 3443 to 3000
[vps-manager-3443]
accept = 3443
connect = 127.0.0.1:3000
client = no
```

### Certificate Info

Sertifikat yang digunakan:
- **Domain:** perumdati.tech
- **Issuer:** Let's Encrypt
- **Valid until:** Jun 8, 2026
- **Auto-renewal:** Via certbot cron

### Restart Stunnel

```bash
# Restart stunnel
systemctl restart stunnel4

# Check status
systemctl status stunnel4

# View logs
tail -f /var/log/stunnel4/stunnel.log
```

## 📁 Struktur Direktori

```
vps-manager/
├── src/
│   ├── database/
│   │   ├── models/       # Sequelize models
│   │   ├── index.js
│   │   └── seed.js
│   ├── middleware/       # Auth, RBAC, Error handlers
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   │   ├── wireguard.service.js
│   │   ├── ufw.service.js
│   │   └── monitoring.service.js
│   ├── utils/            # Utilities
│   └── server.js
├── client/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context
│   │   ├── services/     # API services
│   │   └── App.jsx
│   └── package.json
├── data/                 # SQLite database
├── logs/                 # Application logs
├── package.json
└── .env
```

## 🔧 WireGuard Setup

### Install WireGuard (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install wireguard
```

### Enable IP Forwarding

```bash
# Edit sysctl.conf
sudo nano /etc/sysctl.conf

# Uncomment atau tambahkan:
net.ipv4.ip_forward=1

# Apply
sudo sysctl -p
```

### Start WireGuard

```bash
# Start interface
sudo wg-quick up wg0

# Enable on boot
sudo systemctl enable wg-quick@wg0
```

## 📖 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### WireGuard Peers
- `GET /api/peers` - List peers
- `POST /api/peers` - Create peer
- `PUT /api/peers/:id` - Update peer
- `DELETE /api/peers/:id` - Delete peer
- `GET /api/peers/:id/config` - Download config
- `POST /api/peers/sync` - Sync to WireGuard

### Firewall
- `GET /api/firewall` - List rules
- `POST /api/firewall` - Create rule
- `PUT /api/firewall/:id` - Update rule
- `DELETE /api/firewall/:id` - Delete rule
- `POST /api/firewall/:id/apply` - Apply to UFW
- `GET /api/firewall/ufw-status` - Get UFW status

### Monitoring
- `GET /api/monitoring` - System overview
- `GET /api/monitoring/cpu` - CPU info
- `GET /api/monitoring/memory` - Memory info
- `GET /api/monitoring/disk` - Disk info
- `GET /api/monitoring/network` - Network info

### Audit Logs
- `GET /api/audit` - List logs
- `GET /api/audit/stats` - Statistics

## 🔒 Security Considerations

1. **JWT Secret**: Gunakan random string yang kuat
2. **HTTPS**: Gunakan reverse proxy (nginx) dengan SSL
3. **Firewall**: Batasi akses ke port 3000
4. **Backup**: Backup database secara berkala
5. **Updates**: Update dependencies secara berkala

## 📝 License

MIT License

## 👥 Support

Untuk pertanyaan atau issue, silakan buat issue di repository ini.

---

**VPS Manager v1.0.0** - WireGuard & Firewall Management with RBAC
