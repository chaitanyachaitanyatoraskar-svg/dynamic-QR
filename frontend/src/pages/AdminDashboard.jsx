import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Stack, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BusinessIcon from '@mui/icons-material/Business';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import { cardService, businessService, analyticsService } from '../services/api';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { QRPreviewModal } from '../components/QRPreviewModal';
import { ActivateCardModal } from '../components/ActivateCardModal';

export const AdminDashboard = () => {
  const [cards, setCards] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedCardForQr, setSelectedCardForQr] = useState(null);
  const [selectedCardForActivation, setSelectedCardForActivation] = useState(null);
  const [isReassignModal, setIsReassignModal] = useState(false);

  // Bulk generate modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkPrefix, setBulkPrefix] = useState('B');
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
  const availableCards = cards.filter(c => c.status === 'AVAILABLE').length;
  const totalBusinesses = businesses.length;
  const totalScans = analytics?.total_scans || 0;

  const handleSuspend = async (cardId) => {
    if (window.confirm("Temporarily suspend this card's dynamic routing?")) {
      await cardService.suspend(cardId);
      loadData();
    }
  };

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
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Platform Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage permanent physical NFC / QR cards and dynamic destinations
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setBulkModalOpen(true)}
          >
            Bulk Generate Cards
          </Button>
        </Stack>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Total Cards"
            value={totalCards}
            subtitle="Printed & In-stock"
            icon={QrCodeIcon}
            color="#0f172a"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Active Cards"
            value={activeCards}
            subtitle="Currently routing live"
            icon={CheckCircleIcon}
            color="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Available"
            value={availableCards}
            subtitle="Warehouse inventory"
            icon={Inventory2Icon}
            color="#3b82f6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Businesses"
            value={totalBusinesses}
            subtitle="Registered tenants"
            icon={BusinessIcon}
            color="#8b5cf6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Total Scans"
            value={totalScans}
            subtitle="NFC taps & QR reads"
            icon={TouchAppIcon}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      {/* Recent Cards Inventory Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Recent Physical Cards & Assignments
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Showing {cards.length} cards
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>CARD ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ASSIGNED BUSINESS</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>PURPOSE</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>DESTINATION</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>TOTAL SCANS</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cards.map((c) => (
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
                    <TableCell variant="body2">{c.purpose}</TableCell>
                    <TableCell variant="body2">
                      <Typography variant="caption" sx={{ fontWeight: 600, backgroundColor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1 }}>
                        {c.destination_type}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{c.scan_count?.toLocaleString() || 0}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          title="View / Download QR"
                          onClick={() => setSelectedCardForQr(c)}
                        >
                          <QrCodeIcon fontSize="small" />
                        </IconButton>

                        {c.status === 'AVAILABLE' && (
                          <IconButton
                            size="small"
                            color="success"
                            title="Activate Card"
                            onClick={() => {
                              setSelectedCardForActivation(c);
                              setIsReassignModal(false);
                            }}
                          >
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                        )}

                        {c.status === 'ACTIVE' && (
                          <>
                            <IconButton
                              size="small"
                              color="warning"
                              title="Suspend Card"
                              onClick={() => handleSuspend(c.id)}
                            >
                              <PauseIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="primary"
                              title="Reassign to Another Business"
                              onClick={() => {
                                setSelectedCardForActivation(c);
                                setIsReassignModal(true);
                              }}
                            >
                              <SwapHorizIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* QR Preview Modal */}
      <QRPreviewModal
        open={!!selectedCardForQr}
        card={selectedCardForQr}
        onClose={() => setSelectedCardForQr(null)}
      />

      {/* Activate / Reassign Modal */}
      <ActivateCardModal
        open={!!selectedCardForActivation}
        card={selectedCardForActivation}
        isReassign={isReassignModal}
        onClose={() => setSelectedCardForActivation(null)}
        onSuccess={loadData}
      />

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleBulkGenerate}>
          <DialogTitle>Bulk Generate Physical Cards</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Generate a batch of unique permanent Card IDs and print-ready QR codes. Cards start in <strong>AVAILABLE</strong> inventory status.
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Number of Cards"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              margin="normal"
              inputProps={{ min: 1, max: 200 }}
              required
            />
            <TextField
              fullWidth
              label="Batch Prefix"
              value={bulkPrefix}
              onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
              margin="normal"
              helperText="e.g. A, B, C for batch identification"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setBulkModalOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={bulkSubmitting}
            >
              {bulkSubmitting ? 'Generating...' : 'Generate Batch'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
