import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Stack, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BusinessIcon from '@mui/icons-material/Business';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import AddIcon from '@mui/icons-material/Add';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import EditIcon from '@mui/icons-material/Edit';
import PauseIcon from '@mui/icons-material/Pause';

import { cardService, businessService, analyticsService } from '../services/api';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { QRPreviewModal } from '../components/QRPreviewModal';
import { AdminActivationModal } from '../components/AdminActivationModal';
import { EditDestinationModal } from '../components/EditDestinationModal';

export const AdminDashboard = () => {
  const [cards, setCards] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedCardForQr, setSelectedCardForQr] = useState(null);
  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // Bulk generate modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkPrefix, setBulkPrefix] = useState('A');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cardsRes, bizRes, analyticsRes] = await Promise.all([
        cardService.list(),
        businessService.list(),
        analyticsService.getSummary(),
      ]);
      setCards(cardsRes.data.results || cardsRes.data);
      setBusinesses(bizRes.data.results || bizRes.data);
      setAnalytics(analyticsRes.data);
    } catch (e) {
      console.error("Dashboard data load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCards = cards.length;
  const activeCards = cards.filter(c => c.status === 'ACTIVE').length;
  const unactivatedCards = cards.filter(c => c.status === 'UNACTIVATED').length;
  const totalBusinesses = businesses.length;
  const totalScans = analytics?.total_scans || 0;

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    try {
      setBulkSubmitting(true);
      await cardService.bulkGenerate({ count: parseInt(bulkCount), prefix: bulkPrefix });
      setBulkModalOpen(false);
      loadData();
    } catch (err) {
      alert("Failed to generate bulk cards.");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleSuspend = async (cardId) => {
    if (window.confirm("Temporarily suspend this card's dynamic routing?")) {
      await cardService.suspend(cardId);
      loadData();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Management Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hardware inventory, physical scan activations, and real-time dynamic routing
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<QrCodeScannerIcon />}
            onClick={() => setActivationModalOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            Activate QR (Physical Scan)
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setBulkModalOpen(true)}
          >
            Generate Batch
          </Button>
        </Stack>
      </Box>

      {/* Dynamic Real Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Total QR Cards"
            value={totalCards}
            subtitle="Real inventory count"
            icon={QrCodeIcon}
            color="#0f172a"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Active Routing"
            value={activeCards}
            subtitle="Verified & deployed"
            icon={CheckCircleIcon}
            color="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Unactivated"
            value={unactivatedCards}
            subtitle="Awaiting physical scan"
            icon={Inventory2Icon}
            color="#3b82f6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Clients"
            value={totalBusinesses}
            subtitle="Configured businesses"
            icon={BusinessIcon}
            color="#8b5cf6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Total Scans"
            value={totalScans}
            subtitle="Recorded visits"
            icon={TouchAppIcon}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      {/* Real Cards Inventory Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Physical QR Hardware Inventory
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {cards.length} {cards.length === 1 ? 'card' : 'cards'} total
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>CARD ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>CLIENT / BUSINESS</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>DESTINATION URL</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>FIRST SCANNED</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>SCANS</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                        No QR codes have been created yet.
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Click "Generate Batch" to create your first physical card inventory batch.
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setBulkModalOpen(true)}
                      >
                        Generate First Batch
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  cards.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
                        {c.card_id}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {c.business_name || <Typography variant="caption" color="text.secondary">Unassigned</Typography>}
                      </TableCell>
                      <TableCell variant="body2" sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.destination_url ? (
                          <a href={c.destination_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                            {c.destination_url}
                          </a>
                        ) : (
                          <Typography variant="caption" color="text.secondary">None (Unactivated)</Typography>
                        )}
                      </TableCell>
                      <TableCell variant="body2">
                        {c.first_scanned_at ? (
                          <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                            {new Date(c.first_scanned_at).toLocaleDateString()}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Never Scanned</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{c.scan_count || 0}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            title="Download Print-ready QR"
                            onClick={() => setSelectedCardForQr(c)}
                          >
                            <QrCodeIcon fontSize="small" />
                          </IconButton>

                          {c.status === 'UNACTIVATED' && (
                            <IconButton
                              size="small"
                              color="primary"
                              title="Activate via Physical Scan"
                              onClick={() => setActivationModalOpen(true)}
                            >
                              <QrCodeScannerIcon fontSize="small" />
                            </IconButton>
                          )}

                          {c.status === 'ACTIVE' && (
                            <>
                              <IconButton
                                size="small"
                                color="primary"
                                title="Change Destination (No re-scan needed)"
                                onClick={() => setEditingCard(c)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="warning"
                                title="Suspend Routing"
                                onClick={() => handleSuspend(c.id)}
                              >
                                <PauseIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Merged First-Scan Activation Modal */}
      <AdminActivationModal
        open={activationModalOpen}
        onClose={() => setActivationModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Edit Destination Modal */}
      <EditDestinationModal
        open={!!editingCard}
        card={editingCard}
        onClose={() => setEditingCard(null)}
        onSuccess={loadData}
      />

      {/* QR Preview Modal */}
      <QRPreviewModal
        open={!!selectedCardForQr}
        card={selectedCardForQr}
        onClose={() => setSelectedCardForQr(null)}
      />

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleBulkGenerate}>
          <DialogTitle>Generate Card Inventory Batch</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Generates unactivated cards in warehouse inventory with unique permanent Card IDs and print-ready QR codes.
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Number of Cards to Print"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              margin="normal"
              inputProps={{ min: 1, max: 200 }}
              required
            />
            <TextField
              fullWidth
              label="Alphanumeric Batch Prefix"
              value={bulkPrefix}
              onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
              margin="normal"
              helperText="e.g. A, B, C for batch sequence"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setBulkModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={bulkSubmitting}>
              {bulkSubmitting ? 'Generating...' : 'Generate Batch'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
