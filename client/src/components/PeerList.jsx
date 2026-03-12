import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Visibility,
  Download,
  Edit,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

const PeerList = ({ peers, compact = false, onView, onDownload, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'expired':
        return 'default';
      case 'revoked':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!peers || peers.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" align="center" py={3}>
        No peers found
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size={compact ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>IP Address</TableCell>
            <TableCell>Department</TableCell>
            {!compact && <TableCell>Status</TableCell>}
            {!compact && <TableCell>Last Handshake</TableCell>}
            {compact && <TableCell>Traffic</TableCell>}
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {peers.map((peer) => (
            <TableRow key={peer.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {peer.name}
                </Typography>
                {peer.description && (
                  <Typography variant="caption" color="text.secondary">
                    {peer.description}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">
                  {peer.ip_address}
                </Typography>
              </TableCell>
              <TableCell>
                {peer.department?.code || 'N/A'}
              </TableCell>
              {!compact && (
                <TableCell>
                  <Chip
                    label={peer.status}
                    size="small"
                    color={getStatusColor(peer.status)}
                    icon={
                      peer.status === 'active' ? (
                        <CheckCircle fontSize="small" />
                      ) : (
                        <ErrorIcon fontSize="small" />
                      )
                    }
                  />
                </TableCell>
              )}
              {!compact && (
                <TableCell>
                  {peer.last_handshake ? (
                    format(new Date(peer.last_handshake), 'MMM d, yyyy HH:mm')
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Never
                    </Typography>
                  )}
                </TableCell>
              )}
              {compact && (
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    ↓ {formatBytes(peer.rx_bytes || 0)} ↑ {formatBytes(peer.tx_bytes || 0)}
                  </Typography>
                </TableCell>
              )}
              <TableCell align="right">
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => onView?.(peer)}>
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download Config">
                  <IconButton size="small" onClick={() => onDownload?.(peer)}>
                    <Download fontSize="small" />
                  </IconButton>
                </Tooltip>
                {onEdit && (
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit?.(peer)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => onDelete?.(peer)}>
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
  );
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default PeerList;
