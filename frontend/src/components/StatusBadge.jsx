import React from 'react';
import { Chip } from '@mui/material';

export const StatusBadge = ({ status }) => {
  let color = 'default';
  let variant = 'outlined';

  switch (status) {
    case 'ACTIVE':
      color = 'success';
      variant = 'filled';
      break;
    case 'AVAILABLE':
      color = 'info';
      variant = 'outlined';
      break;
    case 'RESERVED':
      color = 'warning';
      variant = 'outlined';
      break;
    case 'SUSPENDED':
      color = 'warning';
      variant = 'filled';
      break;
    case 'DEACTIVATED':
    case 'LOST':
    case 'RETIRED':
      color = 'error';
      variant = 'outlined';
      break;
    default:
      color = 'default';
  }

  return (
    <Chip
      label={status}
      color={color}
      size="small"
      variant={variant}
      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
    />
  );
};
