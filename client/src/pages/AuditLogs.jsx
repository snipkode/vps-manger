import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Visibility, FilterList } from '@mui/icons-material';
import { format } from 'date-fns';
import { auditService } from '../services';
import { useAuth } from '../context/AuthContext';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
  } catch (error) {
    return 'Invalid date';
  }
};

const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    status: '',
    page: 1,
    limit: 50,
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await auditService.getAll(filters);
      setLogs(response.data.data.logs);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'success',
      READ: 'info',
      UPDATE: 'warning',
      DELETE: 'error',
      LOGIN: 'primary',
      LOGOUT: 'default',
      EXECUTE: 'secondary',
    };
    return colors[action] || 'default';
  };

  return (
    <>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Audit Logs
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        System activity and user action logs
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Action</InputLabel>
              <Select
                value={filters.action}
                label="Action"
                onChange={(e) =>
                  setFilters({ ...filters, action: e.target.value, page: 1 })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="CREATE">CREATE</MenuItem>
                <MenuItem value="READ">READ</MenuItem>
                <MenuItem value="UPDATE">UPDATE</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="LOGIN">LOGIN</MenuItem>
                <MenuItem value="LOGOUT">LOGOUT</MenuItem>
                <MenuItem value="EXECUTE">EXECUTE</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={filters.entity_type}
                label="Entity Type"
                onChange={(e) =>
                  setFilters({ ...filters, entity_type: e.target.value, page: 1 })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Department">Department</MenuItem>
                <MenuItem value="WireGuardPeer">WireGuard Peer</MenuItem>
                <MenuItem value="FirewallRule">Firewall Rule</MenuItem>
                <MenuItem value="System">System</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value, page: 1 })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="failure">Failure</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={getActionColor(log.action)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.entity_type}</Typography>
                      {log.entity_id && (
                        <Typography variant="caption" color="text.secondary">
                          ID: {log.entity_id}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.username}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        {log.ip_address || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        size="small"
                        color={log.status === 'success' ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {logs.length} of {pagination.total} logs
            </Typography>
            <Box>
              <IconButton
                disabled={filters.page <= 1}
                onClick={() =>
                  setFilters({ ...filters, page: filters.page - 1 })
                }
              >
                Previous
              </IconButton>
              <Typography variant="body2" component="span" sx={{ px: 2 }}>
                Page {filters.page} of {pagination.pages || 1}
              </Typography>
              <IconButton
                disabled={filters.page >= pagination.pages}
                onClick={() =>
                  setFilters({ ...filters, page: filters.page + 1 })
                }
              >
                Next
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default AuditLogs;
