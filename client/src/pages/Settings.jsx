import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import { systemService } from '../services';

const Settings = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [wgConfig, setWgConfig] = useState({
    interfaceName: 'wg0',
    port: 51820,
    subnet: '10.0.0.0/24',
  });
  const [systemConfig, setSystemConfig] = useState({
    autoSync: true,
    auditRetention: 90,
  });

  const handleSaveWgConfig = async () => {
    try {
      enqueueSnackbar('WireGuard config saved (not implemented)', {
        variant: 'warning',
      });
    } catch (error) {
      enqueueSnackbar('Failed to save config', { variant: 'error' });
    }
  };

  const handleSaveSystemConfig = async () => {
    try {
      enqueueSnackbar('System config saved (not implemented)', {
        variant: 'warning',
      });
    } catch (error) {
      enqueueSnackbar('Failed to save config', { variant: 'error' });
    }
  };

  const handleRestartWireGuard = async () => {
    if (!window.confirm('Restart WireGuard interface?')) return;

    try {
      await systemService.wgRestart();
      enqueueSnackbar('WireGuard restarted', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to restart WireGuard', { variant: 'error' });
    }
  };

  return (
    <>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        System configuration and preferences
      </Typography>

      <Grid container spacing={3}>
        {/* WireGuard Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              WireGuard Configuration
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Interface Name"
                  value={wgConfig.interfaceName}
                  onChange={(e) =>
                    setWgConfig({ ...wgConfig, interfaceName: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Port"
                  type="number"
                  value={wgConfig.port}
                  onChange={(e) =>
                    setWgConfig({ ...wgConfig, port: parseInt(e.target.value) })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subnet"
                  value={wgConfig.subnet}
                  onChange={(e) =>
                    setWgConfig({ ...wgConfig, subnet: e.target.value })
                  }
                  placeholder="10.0.0.0/24"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveWgConfig}
                >
                  Save Configuration
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRestartWireGuard}
                  sx={{ ml: 1 }}
                >
                  Restart WireGuard
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemConfig.autoSync}
                      onChange={(e) =>
                        setSystemConfig({
                          ...systemConfig,
                          autoSync: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Auto-sync WireGuard peers on changes"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Audit Log Retention (days)"
                  type="number"
                  value={systemConfig.auditRetention}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      auditRetention: parseInt(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveSystemConfig}
                >
                  Save System Settings
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* User Profile */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Profile
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user?.email || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={user?.full_name || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Role"
                  value={user?.role || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={user?.department?.name || 'N/A'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* System Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Version:</strong> 1.0.0
              </Typography>
              <Typography variant="body2">
                <strong>Environment:</strong> {process.env.NODE_ENV || 'development'}
              </Typography>
              <Typography variant="body2">
                <strong>Logged in as:</strong> {user?.email}
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default Settings;
