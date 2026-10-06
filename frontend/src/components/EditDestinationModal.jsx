import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Alert, Box, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { cardService } from '../services/api';

export const EditDestinationModal = ({ open, onClose, card, onSuccess }) => {
  const [destinationUrl, setDestinationUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (card) {
      setDestinationUrl(card.destination_url || '');
      setError('');
    }
  }, [card]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!destinationUrl) {
      setError("Please provide a destination URL.");
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await cardService.updateDestination(card.id, destinationUrl);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to update destination URL.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!card) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon fontSize="small" color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Change Destination
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Physical Card ID: <strong>{card.card_id}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Physical QR remains unchanged. Only backend routing updates.
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="New Destination URL"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            margin="normal"
            required
            autoFocus
            placeholder="https://newclientdestination.com"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            Save Destination
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
