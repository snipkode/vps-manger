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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { departmentService } from '../services';
import { useAuth } from '../context/AuthContext';

const Departments = () => {
  const { hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    network_range: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getAll();
      setDepartments(response.data.data);
    } catch (error) {
      enqueueSnackbar('Failed to load departments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (dept = null) => {
    if (dept) {
      setSelectedDept(dept);
      setFormData({
        name: dept.name || '',
        code: dept.code || '',
        description: dept.description || '',
        network_range: dept.network_range || '',
      });
    } else {
      setSelectedDept(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        network_range: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDept(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedDept) {
        await departmentService.update(selectedDept.id, formData);
        enqueueSnackbar('Department updated', { variant: 'success' });
      } else {
        await departmentService.create(formData);
        enqueueSnackbar('Department created', { variant: 'success' });
      }
      handleCloseDialog();
      fetchDepartments();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Operation failed', {
        variant: 'error',
      });
    }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete department "${dept.name}"?`)) return;

    try {
      await departmentService.delete(dept.id);
      enqueueSnackbar('Department deleted', { variant: 'success' });
      fetchDepartments();
    } catch (error) {
      enqueueSnackbar('Failed to delete department', { variant: 'error' });
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Departments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage organizational departments
          </Typography>
        </Box>
        {hasPermission('firewall:create') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Department
          </Button>
        )}
      </Box>

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
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Network Range</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id} hover>
                    <TableCell>
                      <Chip label={dept.code} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {dept.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{dept.description || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {dept.network_range || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{dept.users?.length || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={dept.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={dept.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {hasPermission('firewall:edit') && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(dept)}
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
                            onClick={() => handleDelete(dept)}
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
            {selectedDept ? 'Edit Department' : 'Create Department'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  required
                  disabled={!!selectedDept}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Network Range (CIDR)"
                  value={formData.network_range}
                  onChange={(e) =>
                    setFormData({ ...formData, network_range: e.target.value })
                  }
                  placeholder="e.g., 10.0.1.0/24"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedDept ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default Departments;
