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
} from '@mui/material';
import { Add, Refresh, Download } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { peerService, departmentService } from '../services';
import { useAuth } from '../context/AuthContext';
import PeerList from '../components/PeerList';

const Peers = () => {
  const { hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [peers, setPeers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_id: '',
    ip_address: '',
    expires_at: '',
  });

  useEffect(() => {
    fetchPeers();
    fetchDepartments();
  }, []);

  const fetchPeers = async () => {
    try {
      setLoading(true);
      const response = await peerService.getAll();
      setPeers(response.data.data);
    } catch (error) {
      enqueueSnackbar('Failed to load peers', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Failed to load departments');
    }
  };

  const handleOpenDialog = (peer = null) => {
    if (peer) {
      setSelectedPeer(peer);
      setFormData({
        name: peer.name || '',
        description: peer.description || '',
        department_id: peer.department_id || '',
        ip_address: peer.ip_address || '',
        expires_at: peer.expires_at ? peer.expires_at.split('T')[0] : '',
      });
    } else {
      setSelectedPeer(null);
      setFormData({
        name: '',
        description: '',
        department_id: '',
        ip_address: '',
        expires_at: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPeer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPeer) {
        await peerService.update(selectedPeer.id, formData);
        enqueueSnackbar('Peer updated successfully', { variant: 'success' });
      } else {
        await peerService.create(formData);
        enqueueSnackbar('Peer created successfully', { variant: 'success' });
      }
      handleCloseDialog();
      fetchPeers();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Operation failed', {
        variant: 'error',
      });
    }
  };

  const handleDelete = async (peer) => {
    if (!window.confirm(`Delete peer "${peer.name}"?`)) return;

    try {
      await peerService.delete(peer.id);
      enqueueSnackbar('Peer deleted successfully', { variant: 'success' });
      fetchPeers();
    } catch (error) {
      enqueueSnackbar('Failed to delete peer', { variant: 'error' });
    }
  };

  const handleDownload = async (peer) => {
    try {
      const response = await peerService.getConfig(peer.id);
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${peer.name}.conf`;
      link.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Config downloaded', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to download config', { variant: 'error' });
    }
  };

  const handleSync = async () => {
    try {
      await peerService.sync();
      enqueueSnackbar('Peers synced to WireGuard', { variant: 'success' });
      fetchPeers();
    } catch (error) {
      enqueueSnackbar('Failed to sync peers', { variant: 'error' });
    }
  };

  const handleView = (peer) => {
    setFormData({
      name: peer.name,
      description: peer.description,
      department_id: peer.department_id,
      ip_address: peer.ip_address,
      expires_at: peer.expires_at ? peer.expires_at.split('T')[0] : '',
    });
    setSelectedPeer(peer);
    setDialogOpen(true);
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            WireGuard Peers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage VPN peer configurations
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {hasPermission('system:execute') && (
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleSync}
            >
              Sync
            </Button>
          )}
          {hasPermission('wireguard:create') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add Peer
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <PeerList
            peers={peers}
            onView={handleView}
            onDownload={handleDownload}
            onEdit={hasPermission('wireguard:edit') ? handleOpenDialog : null}
            onDelete={hasPermission('wireguard:delete') ? handleDelete : null}
          />
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedPeer ? 'Edit Peer' : 'Create New Peer'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department_id}
                    label="Department"
                    onChange={(e) =>
                      setFormData({ ...formData, department_id: e.target.value })
                    }
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IP Address"
                  value={formData.ip_address}
                  onChange={(e) =>
                    setFormData({ ...formData, ip_address: e.target.value })
                  }
                  placeholder="Auto-generated if empty"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Expires At"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expires_at: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedPeer ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default Peers;
