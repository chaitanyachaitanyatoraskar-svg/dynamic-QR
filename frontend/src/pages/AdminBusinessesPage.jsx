import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button,
  IconButton, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LaunchIcon from '@mui/icons-material/Launch';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { Link as RouterLink } from 'react-router-dom';
import { businessService } from '../services/api';

export const AdminBusinessesPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    whatsapp: '',
    address: '',
    city: '',
    google_review_url: '',
  });

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const res = await businessService.list();
      setBusinesses(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await businessService.create(formData);
      setCreateModalOpen(false);
      setFormData({
        name: '', description: '', phone: '', email: '',
        whatsapp: '', address: '', city: '', google_review_url: ''
      });
      loadBusinesses();
    } catch (err) {
      alert("Failed to create business.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Registered Businesses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage multi-tenant business profiles, menu linkages, and card assignments
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
        >
          Add New Business
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>BUSINESS NAME</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>SLUG</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>LOCATION</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>CONTACT</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ACTIVE CARDS</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {businesses.map((b) => (
                    <TableRow key={b.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {b.name}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: 'secondary.main' }}>
                        /business/{b.slug}
                      </TableCell>
                      <TableCell variant="body2">{b.city || '—'}</TableCell>
                      <TableCell variant="body2">{b.phone || b.email || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${b.card_count || 0} cards`}
                          size="small"
                          color={b.card_count > 0 ? "primary" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={b.status} size="small" color="success" />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            component={RouterLink}
                            to={`/business/${b.slug}`}
                            target="_blank"
                            title="View Public Profile"
                          >
                            <LaunchIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            component={RouterLink}
                            to={`/business/${b.slug}/menu`}
                            target="_blank"
                            title="View Public Menu"
                          >
                            <RestaurantMenuIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add Business Modal */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle>Register New Business</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="Business Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
              placeholder="e.g. Blue Lagoon Hotel"
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              placeholder="Brief overview of services / dining style"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="WhatsApp (with country code)"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                margin="normal"
                placeholder="15551234567"
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="City / Metro"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                margin="normal"
              />
            </Stack>
            <TextField
              fullWidth
              label="Google Review URL"
              value={formData.google_review_url}
              onChange={(e) => setFormData({ ...formData, google_review_url: e.target.value })}
              margin="normal"
              placeholder="https://search.google.com/local/writereview?placeid=..."
              helperText="Review funnels will redirect verified customers to this legitimate URL."
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Business'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
