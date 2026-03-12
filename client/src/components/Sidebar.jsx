import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  Shield as FirewallIcon,
  Monitor as MonitorIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', permission: 'monitoring:view' },
  { text: 'WireGuard Peers', icon: <SecurityIcon />, path: '/peers', permission: 'wireguard:view' },
  { text: 'Firewall Rules', icon: <FirewallIcon />, path: '/firewall', permission: 'firewall:view' },
  { text: 'Monitoring', icon: <MonitorIcon />, path: '/monitoring', permission: 'monitoring:view' },
  { text: 'Audit Logs', icon: <AssignmentIcon />, path: '/audit', permission: 'audit:view' },
  { text: 'Departments', icon: <BusinessIcon />, path: '/departments', permission: 'firewall:edit' },
  { text: 'Users', icon: <PeopleIcon />, path: '/users', permission: 'firewall:edit' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings', permission: 'monitoring:view' },
];

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();

  const drawer = (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: [1],
          py: 2,
        }}
      >
        <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          VPS Manager
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
          {user?.full_name?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {user?.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user?.role}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => {
          if (!hasPermission(item.permission)) return null;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) onClose();
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          VPS Manager v1.0.0
        </Typography>
      </Box>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      open={open}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;
