import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, PlayArrow, Refresh } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { firewallService } from '../services';
import { useAuth } from '../context/AuthContext';

const Firewall = () => {
  const { hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [rules, setRules] = useState([]);
  const [ufwStatus, setUfwStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    action: 'allow',
    direction: 'in',
    protocol: 'tcp',
    port: '',
    source_ip: '',
    destination_ip: '',
    priority: 100,
  });

  useEffect(() => {
    fetchRules();
    fetchUFWStatus();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await firewallService.getAll();
      setRules(response.data.data);
    } catch (error) {
      enqueueSnackbar('Failed to load firewall rules', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUFWStatus = async () => {
    try {
      const response = await firewallService.getUFWStatus();
      setUfwStatus(response.data.data);
    } catch (error) {
      console.error('Failed to load UFW status');
    }
  };

  const handleOpenDialog = (rule = null) => {
    if (rule) {
      setSelectedRule(rule);
      setFormData({
        name: rule.name || '',
        action: rule.action || 'allow',
        direction: rule.direction || 'in',
        protocol: rule.protocol || 'tcp',
        port: rule.port || '',
        source_ip: rule.source_ip || '',
        destination_ip: rule.destination_ip || '',
        priority: rule.priority || 100,
      });
    } else {
      setSelectedRule(null);
      setFormData({
        name: '',
        action: 'allow',
        direction: 'in',
        protocol: 'tcp',
        port: '',
        source_ip: '',
        destination_ip: '',
        priority: 100,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRule(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRule) {
        await firewallService.update(selectedRule.id, formData);
        enqueueSnackbar('Rule updated successfully', { variant: 'success' });
      } else {
        await firewallService.create(formData);
        enqueueSnackbar('Rule created successfully', { variant: 'success' });
      }
      handleCloseDialog();
      fetchRules();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Operation failed', {
        variant: 'error',
      });
    }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) return;

    try {
      await firewallService.delete(rule.id);
      enqueueSnackbar('Rule deleted successfully', { variant: 'success' });
      fetchRules();
    } catch (error) {
      enqueueSnackbar('Failed to delete rule', { variant: 'error' });
    }
  };

  const handleApply = async (rule) => {
    try {
      await firewallService.apply(rule.id);
      enqueueSnackbar('Rule applied to UFW', { variant: 'success' });
      fetchRules();
      fetchUFWStatus();
    } catch (error) {
      enqueueSnackbar('Failed to apply rule', { variant: 'error' });
    }
  };

  const handleBulkApply = async () => {
    try {
      await firewallService.bulkApply({});
      enqueueSnackbar('Pending rules applied to UFW', { variant: 'success' });
      fetchRules();
      fetchUFWStatus();
    } catch (error) {
      enqueueSnackbar('Failed to apply rules', { variant: 'error' });
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Firewall Rules
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage UFW firewall rules by department
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchRules();
              fetchUFWStatus();
            }}
          >
            Refresh
          </Button>
          {hasPermission('firewall:edit') && (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleBulkApply}
            >
              Apply Pending Rules
            </Button>
          )}
          {hasPermission('firewall:create') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add Rule
            </Button>
          )}
        </Box>
      </Box>

      {ufwStatus && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                UFW Status
              </Typography>
              <Chip
                label={ufwStatus.active ? 'Active' : 'Inactive'}
                color={ufwStatus.active ? 'success' : 'default'}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Default: {ufwStatus.default.incoming} | {ufwStatus.default.outgoing}
            </Typography>
          </Box>
        </Paper>
      )}

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
                  <TableCell>Name</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Protocol</TableCell>
                  <TableCell>Port</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {rule.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rule.direction}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rule.action}
                        size="small"
                        color={
                          rule.action === 'allow'
                            ? 'success'
                            : rule.action === 'deny'
                            ? 'error'
                            : 'warning'
                        }
                      />
                    </TableCell>
                    <TableCell>{rule.protocol}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {rule.port || 'Any'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {rule.source_ip || 'Any'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {rule.applied ? (
                        <Chip
                          label="Applied"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="Pending"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {!rule.applied && hasPermission('firewall:edit') && (
                        <Tooltip title="Apply to UFW">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApply(rule)}
                          >
                            <PlayArrow fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {hasPermission('firewall:edit') && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(rule)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {hasPermission('firewall:delete') && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(rule)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedRule ? 'Edit Rule' : 'Create New Rule'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rule Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={formData.action}
                    label="Action"
                    onChange={(e) =>
                      setFormData({ ...formData, action: e.target.value })
                    }
                  >
                    <MenuItem value="allow">Allow</MenuItem>
                    <MenuItem value="deny">Deny</MenuItem>
                    <MenuItem value="reject">Reject</MenuItem>
                    <MenuItem value="limit">Limit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Direction</InputLabel>
                  <Select
                    value={formData.direction}
                    label="Direction"
                    onChange={(e) =>
                      setFormData({ ...formData, direction: e.target.value })
                    }
                  >
                    <MenuItem value="in">Inbound</MenuItem>
                    <MenuItem value="out">Outbound</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Protocol</InputLabel>
                  <Select
                    value={formData.protocol}
                    label="Protocol"
                    onChange={(e) =>
                      setFormData({ ...formData, protocol: e.target.value })
                    }
                  >
                    <MenuItem value="tcp">TCP</MenuItem>
                    <MenuItem value="udp">UDP</MenuItem>
                    <MenuItem value="icmp">ICMP</MenuItem>
                    <MenuItem value="any">Any</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Port"
                  value={formData.port}
                  onChange={(e) =>
                    setFormData({ ...formData, port: e.target.value })
                  }
                  placeholder="e.g., 80, 443, 1000:2000"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Source IP"
                  value={formData.source_ip}
                  onChange={(e) =>
                    setFormData({ ...formData, source_ip: e.target.value })
                  }
                  placeholder="Leave empty for any"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Destination IP"
                  value={formData.destination_ip}
                  onChange={(e) =>
                    setFormData({ ...formData, destination_ip: e.target.value })
                  }
                  placeholder="Leave empty for any"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedRule ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default Firewall;
