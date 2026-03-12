#!/bin/bash

# VPS Manager Installation Script
# Ubuntu/Debian Installation

set -e

echo "========================================"
echo "  VPS Manager Installation Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (sudo ./install.sh)${NC}"
    exit 1
fi

echo -e "${GREEN}Starting installation...${NC}"
echo ""

# Update system
echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js
echo -e "${YELLOW}[2/8] Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install WireGuard
echo -e "${YELLOW}[3/8] Installing WireGuard...${NC}"
apt install -y wireguard

# Install UFW
echo -e "${YELLOW}[4/8] Installing UFW...${NC}"
apt install -y ufw

# Enable IP forwarding
echo -e "${YELLOW}[5/8] Enabling IP forwarding...${NC}"
sed -i 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
sysctl -p

# Create application directory
echo -e "${YELLOW}[6/8] Setting up application...${NC}"
cd /root/vps-manager

# Install dependencies
echo -e "${YELLOW}[7/8] Installing npm dependencies...${NC}"
npm install

# Build frontend
echo -e "${YELLOW}[8/8] Building frontend...${NC}"
cd client
npm install
npm run build
cd ..

# Seed database
echo ""
echo -e "${GREEN}Seeding database...${NC}"
npm run seed

# Create systemd service
echo ""
echo -e "${YELLOW}Creating systemd service...${NC}"
cat > /etc/systemd/system/vps-manager.service << EOF
[Unit]
Description=VPS Manager Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/vps-manager
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

echo ""
echo "========================================"
echo -e "${GREEN}  Installation Complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit .env file and change JWT_SECRET and DEFAULT_ADMIN_PASSWORD"
echo "2. Start the service: systemctl start vps-manager"
echo "3. Enable on boot: systemctl enable vps-manager"
echo "4. Access the panel: http://your-server-ip:3000"
echo ""
echo "Default credentials:"
echo "  Email: admin@vps-manager.local"
echo "  Password: Admin123!"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Change the default password after first login!${NC}"
echo ""
