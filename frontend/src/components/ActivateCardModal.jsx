import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, Typography,
  Alert, CircularProgress
} from '@mui/material';
import { businessService, cardService } from '../services/api';

const DESTINATION_TYPES = [
  { value: 'DIGITAL_MENU', label: 'Digital Menu (Mobile-first)' },
  { value: 'BUSINESS_PROFILE', label: 'Business Profile (Hours, Contact, Map)' },
  { value: 'REVIEW_PAGE', label: 'Review Funnel (Google Review link)' },
  { value: 'EXTERNAL_URL', label: 'External Website / Booking System' },
  { value: 'SOCIAL_PROFILE', label: 'Social Profile (Instagram / Facebook)' },
  { value: 'CONTACT_PAGE', label: 'Contact Card (Phone & WhatsApp)' },
];

export const ActivateCardModal = ({ open, onClose, card, isReassign = false, onSuccess }) => {
  const [businesses, setBusinesses] = useState([]);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    business_id: '',
    purpose: 'Digital Menu',
    destination_type: 'DIGITAL_MENU',
    destination_url: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      setError('');
      loadBusinesses();
      if (card) {
        setFormData({
          business_id: card.business || '',
          purpose: card.purpose || 'Digital Menu',
          destination_type: card.destination_type || 'DIGITAL_MENU',
          destination_url: card.destination_url || '',
          notes: card.notes || '',
        });
      }
    }
  }, [open, card]);

  const loadBusinesses = async () => {
    try {
      setLoadingBiz(true);
      const res = await businessService.list();
      const list = res.data.results || res.data;
      setBusinesses(list);
      if (list.length > 0 && !formData.business_id) {
        setFormData((prev) => ({ ...prev, business_id: list[0].id }));
      }
    } catch (e) {
      console.error(e);
      setError('Failed to fetch businesses.');
    } finally {
      setLoadingBiz(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.business_id) {
      setError('Please select a business.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      if (isReassign) {
        await cardService.reassign(card.id, formData);
      } else {
        await cardService.activate(card.id, formData);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Operation failed. Please verify fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isReassign ? `Reassign Card: ${card?.card_id}` : `Activate Card: ${card?.card_id}`}
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Physical Card ID: <strong>{card?.card_id}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Permanent URL: {card?.permanent_url}
            </Typography>
          </Box>

          <TextField
            select
            fullWidth
            label="Assign to Business"
            value={formData.business_id}
            onChange={(e) => setFormData({ ...formData, business_id: e.target.value })}
            margin="normal"
            disabled={loadingBiz}
            required
          >
            {businesses.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name} ({b.slug})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Card Purpose / Label"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            margin="normal"
            placeholder="e.g. Table 4 Menu, Reception NFC Tag, Bar Counter"
            required
          />

          <TextField
            select
            fullWidth
            label="Destination Type"
            value={formData.destination_type}
            onChange={(e) => setFormData({ ...formData, destination_type: e.target.value })}
            margin="normal"
            required
          >
            {DESTINATION_TYPES.map((dt) => (
              <MenuItem key={dt.value} value={dt.value}>
                {dt.label}
              </MenuItem>
            ))}
          </TextField>

          {(formData.destination_type === 'EXTERNAL_URL' ||
            formData.destination_type === 'SOCIAL_PROFILE' ||
            formData.destination_type === 'BOOKING_PAGE') && (
            <TextField
              fullWidth
              label="External Destination URL"
              value={formData.destination_url}
              onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
              margin="normal"
              placeholder="https://example.com/reservation"
              helperText="Must be a valid, trusted destination URL."
              required
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Deployment Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            margin="normal"
            placeholder="Physical location, tag placement or staff notes."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            {isReassign ? 'Reassign Card' : 'Activate Card'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
