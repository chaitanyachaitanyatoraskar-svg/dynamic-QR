import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Button, Stack, TextField, MenuItem, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import EditIcon from '@mui/icons-material/Edit';
import PauseIcon from '@mui/icons-material/Pause';
import BlockIcon from '@mui/icons-material/Block';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

import { cardService } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { QRPreviewModal } from '../components/QRPreviewModal';
import { AdminActivationModal } from '../components/AdminActivationModal';
import { EditDestinationModal } from '../components/EditDestinationModal';

export const AdminCardsPage = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedCardForQr, setSelectedCardForQr] = useState(null);
  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // Bulk generate modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkPrefix, setBulkPrefix] = useState('A');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const loadCards = async () => {
    try {
      setLoading(true);
      const res = await cardService.list();
      setCards(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleSuspend = async (cardId) => {
    if (window.confirm("Suspend this card's destination routing?")) {
      await cardService.suspend(cardId);
      loadCards();
    }
  };

  const handleDeactivate = async (cardId) => {
    if (window.confirm("Permanently deactivate this card?")) {
      await cardService.deactivate(cardId);
      loadCards();
    }
  };

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    try {
      setBulkSubmitting(true);
      await cardService.bulkGenerate({ count: parseInt(bulkCount), prefix: bulkPrefix });
      setBulkModalOpen(false);
      loadCards();
    } catch (err) {
      alert("Bulk generation error.");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const filteredCards = cards.filter((c) => {
    const matchesSearch = c.card_id.toLowerCase().includes(search.toLowerCase()) ||
      (c.business_name && c.business_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.destination_url && c.destination_url.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Physical Card Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Every card has a permanent physical URL (/q/ID). Activation requires an authorized admin physical scan.
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

      {/* Filter bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Search by Card ID, client, destination URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 160 }}
              label="Filter Status"
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="UNACTIVATED">UNACTIVATED</MenuItem>
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="SUSPENDED">SUSPENDED</MenuItem>
              <MenuItem value="DEACTIVATED">DEACTIVATED</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
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
                    <TableCell sx={{ fontWeight: 600 }}>CARD ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>CLIENT / BUSINESS</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>DESTINATION URL</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>FIRST SCANNED</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>TOTAL SCANS</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                        {cards.length === 0
                          ? "No QR codes have been created yet. Generate your first QR batch to get started."
                          : "No cards found matching your filter criteria."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCards.map((c) => (
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
                                  title="Change Destination URL (No re-scan required)"
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
                                <IconButton
                                  size="small"
                                  color="error"
                                  title="Deactivate Card"
                                  onClick={() => handleDeactivate(c.id)}
                                >
                                  <BlockIcon fontSize="small" />
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
          )}
        </CardContent>
      </Card>

      <AdminActivationModal
        open={activationModalOpen}
        onClose={() => setActivationModalOpen(false)}
        onSuccess={loadCards}
      />

      <EditDestinationModal
        open={!!editingCard}
        card={editingCard}
        onClose={() => setEditingCard(null)}
        onSuccess={loadCards}
      />

      <QRPreviewModal
        open={!!selectedCardForQr}
        card={selectedCardForQr}
        onClose={() => setSelectedCardForQr(null)}
      />

      <Dialog open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleBulkGenerate}>
          <DialogTitle>Generate Card Inventory Batch</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Batch creates cards in <strong>UNACTIVATED</strong> warehouse inventory with unique permanent IDs and server-generated print-ready QR codes.
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Quantity"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              margin="normal"
              inputProps={{ min: 1, max: 200 }}
              required
            />
            <TextField
              fullWidth
              label="Alphanumeric Prefix"
              value={bulkPrefix}
              onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
              margin="normal"
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
