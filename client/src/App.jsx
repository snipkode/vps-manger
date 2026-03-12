import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { useAuth } from './context/AuthContext';
import { useSnackbar } from 'notistack';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Peers from './pages/Peers';
import Firewall from './pages/Firewall';
import Monitoring from './pages/Monitoring';
import AuditLogs from './pages/AuditLogs';
import Departments from './pages/Departments';
import Users from './pages/Users';
import Settings from './pages/Settings';

// Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        Loading...
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) {
    return (
      <>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: 8,
            ml: sidebarOpen ? '240px' : 0,
            transition: 'margin 0.3s ease',
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/peers" element={<Peers />} />
            <Route path="/firewall" element={<Firewall />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    </>
  );
}

export default App;
