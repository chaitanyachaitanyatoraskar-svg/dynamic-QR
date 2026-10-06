import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import ContactlessIcon from '@mui/icons-material/Contactless';
import { cardService } from '../services/api';

export const DynamicGoResolver = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const resolveCard = async () => {
      try {
        const res = await cardService.resolveDirect(cardId);
        const data = res.data;

        if (data.status === 'ACTIVE' && data.target_url) {
          // If external destination, redirect window
          if (data.target_url.startsWith('http://') || data.target_url.startsWith('https://')) {
            const currentOrigin = window.location.origin;
            if (data.target_url.startsWith(currentOrigin)) {
              // Internal SPA path
              const relativePath = data.target_url.replace(currentOrigin, '');
              navigate(relativePath, { replace: true });
            } else {
              window.location.href = data.target_url;
            }
          } else {
            navigate(data.target_url, { replace: true });
          }
        } else {
          navigate(`/card-status?status=${data.status || 'INACTIVE'}&card_id=${cardId}`, { replace: true });
        }
      } catch (err) {
        const status = err.response?.data?.status || 'NOT_FOUND';
        navigate(`/card-status?status=${status}&card_id=${cardId}`, { replace: true });
      }
    };

    if (cardId) {
      resolveCard();
    }
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
          maxWidth: 360,
          width: '100%',
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: '#0f172a',
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
          Resolving Card {cardId}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Connecting to dynamic destination...
        </Typography>
        <CircularProgress size={28} />
      </Paper>
    </Box>
  );
};
