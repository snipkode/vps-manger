import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const peerService = {
  getAll: (params) => api.get('/peers', { params }),
  getById: (id) => api.get(`/peers/${id}`),
  create: (data) => api.post('/peers', data),
  update: (id, data) => api.put(`/peers/${id}`, data),
  delete: (id) => api.delete(`/peers/${id}`),
  getConfig: (id) => api.get(`/peers/${id}/config`, { responseType: 'blob' }),
  sync: () => api.post('/peers/sync'),
  getInterfaceStatus: () => api.get('/peers/status/interface'),
};

export const firewallService = {
  getAll: (params) => api.get('/firewall', { params }),
  getUFWStatus: () => api.get('/firewall/ufw-status'),
  create: (data) => api.post('/firewall', data),
  update: (id, data) => api.put(`/firewall/${id}`, data),
  delete: (id) => api.delete(`/firewall/${id}`),
  apply: (id) => api.post(`/firewall/${id}/apply`),
  bulkApply: (data) => api.post('/firewall/bulk-apply', data),
};

export const monitoringService = {
  getOverview: () => api.get('/monitoring'),
  getCPU: () => api.get('/monitoring/cpu'),
  getMemory: () => api.get('/monitoring/memory'),
  getDisk: () => api.get('/monitoring/disk'),
  getNetwork: () => api.get('/monitoring/network'),
  getOS: () => api.get('/monitoring/os'),
  getWireGuard: () => api.get('/monitoring/wireguard'),
};

export const auditService = {
  getAll: (params) => api.get('/audit', { params }),
  getById: (id) => api.get(`/audit/${id}`),
  getStats: (params) => api.get('/audit/stats', { params }),
  clear: (days) => api.delete('/audit/clear', { params: { days } }),
};

export const departmentService = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const systemService = {
  // WireGuard
  wgRestart: () => api.post('/system/wireguard/restart'),
  wgStart: () => api.post('/system/wireguard/start'),
  wgStop: () => api.post('/system/wireguard/stop'),
  wgStatus: () => api.get('/system/wireguard/status'),
  // UFW
  ufwEnable: () => api.post('/system/ufw/enable'),
  ufwDisable: () => api.post('/system/ufw/disable'),
  ufwReset: () => api.post('/system/ufw/reset'),
  ufwStatus: () => api.get('/system/ufw/status'),
  ufwRule: (data) => api.post('/system/ufw/rule', data),
};
