import React from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import { Box, Paper, Typography, Button, Chip } from '@mui/material';
import ContactlessIcon from '@mui/icons-material/Contactless';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const CardStatusPage = () => {
  const [params] = useSearchParams();
  const status = (params.get('status') || 'INACTIVE').toUpperCase();
  const cardId = params.get('card_id') || '';

  let title = "Card Status Notice";
  let message = "This card is currently not configured to route to an active destination.";
  let Icon = InfoOutlinedIcon;
  let chipColor = 'default';

  if (status === 'NOT_FOUND') {
    title = "Card Not Found";
    message = "Sorry, this card does not exist or has an invalid identifier.";
    Icon = ErrorIcon;
    chipColor = 'error';
  } else if (status === 'SUSPENDED') {
    title = "Card Temporarily Suspended";
    message = "This card is temporarily unavailable. Please check back later or notify venue staff.";
    Icon = WarningAmberIcon;
    chipColor = 'warning';
  } else if (status === 'DEACTIVATED') {
    title = "Card Inactive";
    message = "This card has been retired or deactivated by the platform.";
    Icon = ErrorIcon;
    chipColor = 'error';
  } else if (status === 'UNACTIVATED' || status === 'AVAILABLE') {
    title = "QR NOT ACTIVATED";
    message = "This QR code has not been activated yet.";
    Icon = InfoOutlinedIcon;
    chipColor = 'info';
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          maxWidth: 420,
          width: '100%',
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Icon fontSize="large" />
        </Box>

        {cardId && (
          <Box sx={{ mb: 1.5 }}>
            <Chip label={`CARD ID: ${cardId}`} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
          </Box>
        )}

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a' }}>
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
          {message}
        </Typography>

        <Button
          variant="outlined"
          color="inherit"
          size="small"
          component={RouterLink}
          to="/"
          sx={{ borderColor: '#cbd5e1' }}
        >
          Return to Platform Home
        </Button>
      </Paper>
    </Box>
  );
};
