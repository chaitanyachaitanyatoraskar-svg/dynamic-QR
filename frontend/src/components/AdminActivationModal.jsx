import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Alert, Stack,
  CircularProgress, Divider, MenuItem, Chip, IconButton,
  Paper, Tabs, Tab, Tooltip
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LinkIcon from '@mui/icons-material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { activationSessionService, businessService, cardService } from '../services/api';

export const AdminActivationModal = ({ open, onClose, onSuccess, initialCard = null }) => {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [unactivatedCards, setUnactivatedCards] = useState([]);

  // Selection method: 0 = 'inventory_select', 1 = 'scanner_input'
  const [tabIndex, setTabIndex] = useState(0);

  // Selected card to activate
  const [selectedCard, setSelectedCard] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [verifyingScan, setVerifyingScan] = useState(false);

  // Camera scanner state
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Redirection destination form
  const [formData, setFormData] = useState({
    business_id: '',
    client_name: '',
    destination_url: '',
    purpose: 'Client Website',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let pollTimer = null;

    if (open) {
      setError('');
      setInfoMsg('');
      setManualInput('');
      setUseCamera(false);
      setFormData({
        business_id: '',
        client_name: '',
        destination_url: '',
        purpose: 'Client Website',
        notes: '',
      });

      const initData = async () => {
        try {
          setLoadingSession(true);
          const [bizRes, cardsRes] = await Promise.all([
            businessService.list(),
            cardService.list({ status: 'UNACTIVATED' }),
          ]);

          const bizList = bizRes.data?.results || bizRes.data;
          setBusinesses(Array.isArray(bizList) ? bizList : []);

          const cardList = cardsRes.data?.results || cardsRes.data;
          const available = Array.isArray(cardList) ? cardList : [];
          setUnactivatedCards(available);

          if (initialCard) {
            setSelectedCard(initialCard);
          } else if (available.length > 0) {
            // Default to first available unactivated card for fast 1-click activation
            setSelectedCard(available[0]);
          } else {
            setSelectedCard(null);
          }

          // Also start background session if available
          try {
            const sessRes = await activationSessionService.start();
            setSession(sessRes.data);
          } catch (e) {
            // fallback gracefully
          }
        } catch (err) {
          console.error("Init activation modal error:", err);
          setError('Failed to load card inventory. Please refresh and try again.');
        } finally {
          setLoadingSession(false);
        }
      };

      initData();
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      stopCamera();
    };
  }, [open, initialCard]);

  const startCamera = async () => {
    try {
      setUseCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera access unavailable", err);
      setError("Camera scanner unavailable. Please select from inventory or enter Card ID manually.");
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setUseCamera(false);
  };

  // Smart input handler: checks whether user entered a Card ID or a Destination Link
  const handleVerifyOrInput = async (e) => {
    e?.preventDefault();
    const raw = manualInput.trim();
    if (!raw) return;

    setError('');
    setInfoMsg('');

    // Case 1: User pasted a destination redirection link (e.g. https://www.youtube.com)
    const isUrl = raw.startsWith('http://') || raw.startsWith('https://');
    const isCardScanUrl = raw.includes('/q/') || raw.includes('/go/');

    if (isUrl && !isCardScanUrl) {
      // Intelligently save as destination URL!
      setFormData(prev => ({ ...prev, destination_url: raw }));
      setManualInput('');
      setInfoMsg(`Redirection link detected and set to: ${raw}`);

      if (!selectedCard && unactivatedCards.length > 0) {
        setSelectedCard(unactivatedCards[0]);
      }
      return;
    }

    // Case 2: User entered a Card ID or scanned card QR URL
    let candidateCardId = raw;
    if (candidateCardId.includes('/q/')) {
      candidateCardId = candidateCardId.split('/q/')[1].split('/')[0].split('?')[0];
    } else if (candidateCardId.includes('/go/')) {
      candidateCardId = candidateCardId.split('/go/')[1].split('/')[0].split('?')[0];
    }

    // Look for matching card in inventory
    const match = unactivatedCards.find(
      c => c.card_id?.toLowerCase() === candidateCardId.toLowerCase()
    );

    if (match) {
      setSelectedCard(match);
      setManualInput('');
      setInfoMsg(`Card '${match.card_id}' verified from inventory.`);
    } else {
      // Try verifying via session API
      try {
        setVerifyingScan(true);
        if (session) {
          const res = await activationSessionService.verifyScan(session.id, candidateCardId);
          setSelectedCard(res.data.card);
          setManualInput('');
          setInfoMsg(`Card '${res.data.card.card_id}' verified successfully.`);
        } else {
          setError(`Card '${candidateCardId}' was not found among unactivated inventory cards.`);
        }
      } catch (err) {
        setError(err.response?.data?.error || `Card '${candidateCardId}' does not exist in inventory.`);
      } finally {
        setVerifyingScan(false);
      }
    }
  };

  // Handle final activation submission
  const handleSubmitActivation = async (e) => {
    e.preventDefault();

    if (!selectedCard) {
      setError("Please select a physical Card ID from your inventory to activate.");
      return;
    }

    if (!formData.destination_url.trim()) {
      setError("Redirection destination URL is required (e.g. https://www.youtube.com).");
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setInfoMsg('');

      // Direct activation
      await cardService.activate(selectedCard.id, formData);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Activation failed:", err);
      // Fallback to session completion if direct fails
      if (session) {
        try {
          await activationSessionService.complete(session.id, formData);
          onSuccess?.();
          onClose();
          return;
        } catch (sessErr) {
          setError(sessErr.response?.data?.error || "Failed to activate card.");
        }
      } else {
        setError(err.response?.data?.error || "Failed to activate card. Please verify destination URL.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: 'primary.main',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <QrCodeScannerIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Activate QR / NFC Card
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Configure dynamic redirection destination
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ py: 2.5 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {infoMsg && <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>{infoMsg}</Alert>}

        {loadingSession ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading inventory and activation tools...
            </Typography>
          </Box>
        ) : (
          <form onSubmit={handleSubmitActivation}>
            {/* CARD SELECTION SECTION */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2.5,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 2.5
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Step 1: Select Card to Activate
                </Typography>
                {unactivatedCards.length > 0 && (
                  <Chip
                    label={`${unactivatedCards.length} Unactivated Available`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600, height: 22 }}
                  />
                )}
              </Box>

              <Tabs
                value={tabIndex}
                onChange={(e, v) => setTabIndex(v)}
                sx={{ minHeight: 36, mb: 1.5 }}
              >
                <Tab
                  label="Select from Inventory"
                  icon={<Inventory2Icon fontSize="small" />}
                  iconPosition="start"
                  sx={{ minHeight: 36, py: 0.5, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                />
                <Tab
                  label="Scan / Type Card ID"
                  icon={<QrCodeScannerIcon fontSize="small" />}
                  iconPosition="start"
                  sx={{ minHeight: 36, py: 0.5, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                />
              </Tabs>

              {/* Tab 0: Dropdown from Inventory */}
              {tabIndex === 0 && (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Card ID from Inventory"
                  value={selectedCard?.card_id || ''}
                  onChange={(e) => {
                    const match = unactivatedCards.find(c => c.card_id === e.target.value);
                    if (match) setSelectedCard(match);
                  }}
                  helperText="Select which physical card from your inventory you are deploying"
                >
                  {unactivatedCards.length === 0 ? (
                    <MenuItem value="" disabled>No unactivated cards found in inventory</MenuItem>
                  ) : (
                    unactivatedCards.map((c) => (
                      <MenuItem key={c.id} value={c.card_id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                            {c.card_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.purpose || 'Unassigned'}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </TextField>
              )}

              {/* Tab 1: Scanner / Type Card ID */}
              {tabIndex === 1 && (
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter Card ID (e.g. D-01YKEU1) or paste URL"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleVerifyOrInput();
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleVerifyOrInput}
                      disabled={verifyingScan || !manualInput.trim()}
                      startIcon={verifyingScan && <CircularProgress size={16} />}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Verify
                    </Button>
                  </Stack>

                  {useCamera ? (
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <video
                        ref={videoRef}
                        style={{ width: '100%', maxHeight: 180, borderRadius: 8, border: '1px solid #cbd5e1' }}
                        playsInline
                      />
                      <Button
                        size="small"
                        color="error"
                        startIcon={<VideocamOffIcon />}
                        onClick={stopCamera}
                        sx={{ mt: 0.5 }}
                      >
                        Stop Camera
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<VideocamIcon />}
                      onClick={startCamera}
                    >
                      Scan using Camera
                    </Button>
                  )}
                </Box>
              )}

              {selectedCard && (
                <Box sx={{ mt: 1.5, p: 1, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 600 }}>
                    Target Card: <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{selectedCard.card_id}</span> is ready for activation
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* STEP 2: REDIRECTION DESTINATION CONFIGURATION */}
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                Step 2: Configure Redirection Destination
              </Typography>

              <TextField
                fullWidth
                id="destination-url-input"
                label="Redirection Link / Destination URL"
                placeholder="https://www.youtube.com or https://clientwebsite.com"
                value={formData.destination_url}
                onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
                margin="dense"
                required
                autoFocus
                InputProps={{
                  startAdornment: <LinkIcon sx={{ color: 'primary.main', mr: 1 }} />
                }}
                helperText="Physical card scans will immediately and permanently redirect to this destination."
              />

              <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Assign to Client / Business"
                  value={formData.business_id}
                  onChange={(e) => setFormData({ ...formData, business_id: e.target.value, client_name: '' })}
                >
                  <MenuItem value="">-- None / General Public --</MenuItem>
                  {businesses.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  size="small"
                  label="Or New Client Name"
                  placeholder="e.g. Acme Corp"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value, business_id: '' })}
                />
              </Stack>

              <TextField
                fullWidth
                size="small"
                label="Deployment Purpose / Tag"
                placeholder="e.g. Reception Desk, YouTube Promo, Dining Table"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                margin="dense"
                sx={{ mt: 1.5 }}
              />

              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Deployment Notes (Optional)"
                placeholder="Internal notes regarding card deployment..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                margin="dense"
                sx={{ mt: 1.5 }}
              />
            </Box>

            <DialogActions sx={{ px: 0, pt: 2, pb: 0 }}>
              <Button onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={submitting || !selectedCard || !formData.destination_url.trim()}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
                sx={{ px: 3, fontWeight: 700 }}
              >
                {submitting ? 'Activating...' : `Activate Card ${selectedCard?.card_id || ''}`}
              </Button>
            </DialogActions>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
