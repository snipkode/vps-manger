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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { userService, departmentService } from '../services';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const { hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'user',
    department_id: '',
    phone: '',
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      setUsers(response.data.data);
    } catch (error) {
      enqueueSnackbar('Failed to load users', { variant: 'error' });
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

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        password: '',
        role: user.role || 'user',
        department_id: user.department_id || '',
        phone: user.phone || '',
        is_active: user.is_active ?? true,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: '',
        full_name: '',
        password: '',
        role: 'user',
        department_id: '',
        phone: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userService.update(selectedUser.id, updateData);
        enqueueSnackbar('User updated', { variant: 'success' });
      } else {
        await userService.create(formData);
        enqueueSnackbar('User created', { variant: 'success' });
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Operation failed', {
        variant: 'error',
      });
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.email}"?`)) return;

    try {
      await userService.delete(user.id);
      enqueueSnackbar('User deleted', { variant: 'success' });
      fetchUsers();
    } catch (error) {
      enqueueSnackbar('Failed to delete user', { variant: 'error' });
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      super_admin: 'error',
      admin: 'warning',
      department_head: 'info',
      user: 'default',
    };
    return colors[role] || 'default';
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system users and access
          </Typography>
        </Box>
        {hasPermission('wireguard:create') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add User
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
                  <TableCell>Email</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={getRoleColor(user.role)}
                      />
                    </TableCell>
                    <TableCell>{user.department?.name || '-'}</TableCell>
                    <TableCell>
                      {user.last_login ? (
                        new Date(user.last_login).toLocaleDateString()
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Never
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={user.is_active ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {hasPermission('wireguard:edit') && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {hasPermission('wireguard:delete') && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(user)}
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
            {selectedUser ? 'Edit User' : 'Create User'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={!!selectedUser}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!selectedUser}
                  placeholder={selectedUser ? 'Leave blank to keep current' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="department_head">Department Head</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="super_admin">Super Admin</MenuItem>
                  </Select>
                </FormControl>
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
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {!selectedUser && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.is_active ? 'active' : 'inactive'}
                      label="Status"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.value === 'active',
                        })
                      }
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default Users;
