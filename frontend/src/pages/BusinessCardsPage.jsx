import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  CircularProgress, Chip, Stack
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import LaunchIcon from '@mui/icons-material/Launch';

import { cardService } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { QRPreviewModal } from '../components/QRPreviewModal';

export const BusinessCardsPage = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardForQr, setSelectedCardForQr] = useState(null);

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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Assigned Physical Cards
        </Typography>
        <Typography variant="body2" color="text.secondary">
          These permanent NFC/QR cards are assigned to your venue. You can view permanent URLs and download print-ready QR codes.
        </Typography>
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
                    <TableCell sx={{ fontWeight: 600 }}>CARD ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>PURPOSE / LOCATION</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>DESTINATION TYPE</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>TOTAL SCANS</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                        No cards currently assigned to your business. Contact admin to assign new cards.
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
                        <TableCell variant="body2">{c.purpose}</TableCell>
                        <TableCell variant="body2">
                          <Chip label={c.destination_type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{c.scan_count?.toLocaleString() || 0}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              title="QR Code & Download"
                              onClick={() => setSelectedCardForQr(c)}
                            >
                              <QrCodeIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              href={c.permanent_url}
                              target="_blank"
                              title="Test Permanent URL"
                            >
                              <LaunchIcon fontSize="small" />
                            </IconButton>
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

      <QRPreviewModal
        open={!!selectedCardForQr}
        card={selectedCardForQr}
        onClose={() => setSelectedCardForQr(null)}
      />
    </Box>
  );
};
