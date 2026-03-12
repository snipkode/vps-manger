import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Security,
  Shield as FirewallIcon,
  Dns,
  Memory,
  Storage,
  NetworkCheck,
} from '@mui/icons-material';
import { monitoringService, peerService, firewallService } from '../services';
import StatCard from '../components/StatCard';
import PeerList from '../components/PeerList';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [peers, setPeers] = useState([]);
  const [firewallRules, setFirewallRules] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [monitoring, peersRes, firewallRes] = await Promise.all([
        monitoringService.getOverview().catch(() => null),
        peerService.getAll().catch(() => null),
        firewallService.getAll().catch(() => null),
      ]);

      setStats(monitoring?.data?.data);
      setPeers(peersRes?.data?.data || []);
      setFirewallRules(firewallRes?.data?.data || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const activePeers = peers.filter((p) => p.status === 'active').length;
  const activeRules = firewallRules.filter((r) => r.is_active).length;

  return (
    <>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        System Overview and Statistics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Peers"
            value={activePeers}
            total={peers.length}
            icon={<Security />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Firewall Rules"
            value={activeRules}
            total={firewallRules.length}
            icon={<FirewallIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="CPU Usage"
            value={stats?.cpu?.usage?.current?.toFixed(1) || 0}
            suffix="%"
            icon={<Memory />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Memory Usage"
            value={stats?.memory?.usage?.percent?.toFixed(1) || 0}
            suffix="%"
            icon={<Dns />}
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Info
            </Typography>
            {stats?.os && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  <strong>OS:</strong> {stats.os.distro} {stats.os.release}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Kernel:</strong> {stats.os.kernel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Hostname:</strong> {stats.os.hostname}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Uptime:</strong> {stats.os.uptime}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Disk Usage
            </Typography>
            {stats?.disk?.disks?.slice(0, 2).map((disk, idx) => (
              <Box key={idx} mb={2}>
                <Typography variant="body2" color="text.secondary">
                  <strong>{disk.mount}:</strong> {disk.usage}% used
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {disk.used} / {disk.size}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} mt={1}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Peers
            </Typography>
            <PeerList peers={peers.slice(0, 5)} compact />
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard;
