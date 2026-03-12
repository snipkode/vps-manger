import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Dns as DnsIcon,
  NetworkCheck as NetworkIcon,
} from '@mui/icons-material';
import { monitoringService } from '../services';
import StatCard from '../components/StatCard';

const Monitoring = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await monitoringService.getOverview();
      setStats(response.data.data);
    } catch (err) {
      setError('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        System Monitoring
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Real-time system resource monitoring
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="CPU Usage"
            value={stats?.cpu?.usage?.current?.toFixed(1) || 0}
            suffix="%"
            icon={<MemoryIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Memory Usage"
            value={stats?.memory?.usage?.percent?.toFixed(1) || 0}
            suffix="%"
            icon={<DnsIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Disk Usage"
            value={stats?.disk?.disks?.[0]?.usage?.toFixed(1) || 0}
            suffix="%"
            icon={<StorageIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Network Interfaces"
            value={stats?.network?.interfaces?.length || 0}
            icon={<NetworkIcon />}
            color="primary"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* CPU Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              CPU Information
            </Typography>
            {stats?.cpu && (
              <>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    {stats.cpu.manufacturer} {stats.cpu.brand}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.cpu.cores} Cores | {stats.cpu.speed} GHz
                  </Typography>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Usage</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.cpu.usage.current.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stats.cpu.usage.current}
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Memory Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Memory Information
            </Typography>
            {stats?.memory && (
              <>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Total: {stats.memory.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Used: {stats.memory.used} | Free: {stats.memory.free}
                  </Typography>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Usage</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.memory.usage.percent}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stats.memory.usage.percent}
                    color="error"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Swap
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.memory.swap.usage}
                    color="info"
                    sx={{ height: 6, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {stats.memory.swap.used} / {stats.memory.swap.total} (
                    {stats.memory.swap.usage}%)
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Disk Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Disk Usage
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Filesystem</TableCell>
                    <TableCell>Mount Point</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Used</TableCell>
                    <TableCell>Available</TableCell>
                    <TableCell>Usage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.disk?.disks?.map((disk, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{disk.filesystem}</TableCell>
                      <TableCell fontFamily="monospace">{disk.mount}</TableCell>
                      <TableCell>{disk.size}</TableCell>
                      <TableCell>{disk.used}</TableCell>
                      <TableCell>{disk.available}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={disk.usage}
                            color={disk.usage > 80 ? 'error' : 'primary'}
                            sx={{ width: 100, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {disk.usage}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Network Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Network Interfaces
            </Typography>
            {stats?.network?.interfaces?.map((iface, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 2,
                  mb: 1,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  {iface.iface}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  IPv4: {iface.ip4 || 'N/A'} | IPv6: {iface.ip6 || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  MAC: {iface.mac}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* OS Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            {stats?.os && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  <strong>OS:</strong> {stats.os.distro} {stats.os.release} (
                  {stats.os.codename})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Kernel:</strong> {stats.os.kernel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Architecture:</strong> {stats.os.arch}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Hostname:</strong> {stats.os.hostname}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Uptime:</strong> {stats.os.uptime}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Timezone:</strong> {stats.os.timezone}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default Monitoring;
