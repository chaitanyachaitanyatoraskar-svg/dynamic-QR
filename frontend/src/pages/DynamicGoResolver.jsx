import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Paper, Button, Alert } from '@mui/material';
import ContactlessIcon from '@mui/icons-material/Contactless';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import { cardService } from '../services/api';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8088';

export const DynamicGoResolver = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('Connecting to dynamic destination...');
  const [destinationUrl, setDestinationUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const resolveCard = async () => {
      try {
        const res = await cardService.resolveDirect(cardId);
        const data = res.data;

        const target = data.destination_url || data.target_url;
        if (data.status === 'ACTIVE' && target) {
          if (isMounted) {
            setDestinationUrl(target);
            setStatusMessage(`Redirecting to ${target}...`);
          }

          // If external destination, perform immediate top-level browser redirect
          if (target.startsWith('http://') || target.startsWith('https://')) {
            const currentOrigin = window.location.origin;
            if (target.startsWith(currentOrigin)) {
              // Internal SPA path
              const relativePath = target.replace(currentOrigin, '');
              navigate(relativePath, { replace: true });
            } else {
              window.location.replace(target);
            }
          } else {
            navigate(target, { replace: true });
          }
          return;
        } else if (data.status === 'SCAN_VERIFIED') {
          navigate(`/admin/dashboard?verified_card=${cardId}`, { replace: true });
          return;
        } else {
          navigate(`/card-status?status=${data.status || 'UNACTIVATED'}&card_id=${cardId}`, { replace: true });
          return;
        }
      } catch (err) {
        // If server explicitly returned 403 or 404 with status information
        if (err.response?.status === 403 || err.response?.status === 404) {
          const status = err.response?.data?.status || (err.response?.status === 404 ? 'NOT_FOUND' : 'UNACTIVATED');
          navigate(`/card-status?status=${status}&card_id=${cardId}`, { replace: true });
          return;
        }

        // If running in local environment, fallback to direct backend HTTP 302 endpoint
        const isLocalOrigin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isLocalApi = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1');

        if (isLocalOrigin || !isLocalApi) {
          window.location.replace(`${API_BASE}/q/${cardId}/`);
        } else {
          // Running on production site (e.g. Vercel) but API_BASE is still pointing to local machine
          if (isMounted) {
            setErrorMessage(
              'Backend service unreachable. Please ensure the backend API is deployed and VITE_API_BASE is configured on Vercel.'
            );
            setStatusMessage('Connection Error');
          }
        }
      }
    };

    if (cardId) {
      resolveCard();
    }

    return () => {
      isMounted = false;
    };
  }, [cardId, navigate]);

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
          p: 4,
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: errorMessage ? '#ef4444' : '#0f172a',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <ContactlessIcon fontSize="medium" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Routing Card {cardId}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {statusMessage}
        </Typography>

        {!errorMessage && <CircularProgress size={28} sx={{ mb: destinationUrl ? 2 : 0 }} />}

        {destinationUrl && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              href={destinationUrl}
              endIcon={<OpenInNewIcon fontSize="small" />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Open Destination Link
            </Button>
          </Box>
        )}

        {errorMessage && (
          <Box sx={{ mt: 2, textAlign: 'left' }}>
            <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8125rem' }}>
              {errorMessage}
            </Alert>
            <Button
              variant="outlined"
              fullWidth
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              sx={{ textTransform: 'none' }}
            >
              Retry
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
