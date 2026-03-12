import React from 'react';
import { Paper, Box, Typography, LinearProgress } from '@mui/material';

const StatCard = ({ title, value, total, suffix = '', icon, color = 'primary' }) => {
  const percentage = total ? ((value / total) * 100).toFixed(0) : 0;

  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: 140,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          opacity: 0.1,
          color: `${color}.main`,
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 100 } })}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            bgcolor: `${color}.light`,
            color: `${color}.main`,
            borderRadius: '50%',
            p: 1,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Typography color="text.secondary" variant="body2">
          {title}
        </Typography>
      </Box>
      <Typography component="h3" variant="h4" fontWeight="bold" gutterBottom>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix}
      </Typography>
      {total !== undefined && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            color={color}
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {value} of {total} ({percentage}%)
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default StatCard;
