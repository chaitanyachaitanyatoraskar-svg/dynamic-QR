import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Alert, Stack,
  CircularProgress, Divider, MenuItem, Chip, IconButton
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import LaunchIcon from '@mui/icons-material/Launch';

import { activationSessionService, businessService } from '../services/api';

export const AdminActivationModal = ({ open, onClose, onSuccess }) => {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState('');
  const [businesses, setBusinesses] = useState([]);

  // Physical scan verification state
  const [verifiedCard, setVerifiedCard] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [verifyingScan, setVerifyingScan] = useState(false);

  // Camera scanner state
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Form after physical scan verification
  const [formData, setFormData] = useState({
    business_id: '',
    client_name: '',
    destination_url: '',
    purpose: 'Client Website',
    notes: '',
  });
  const [completing, setCompleting] = useState(false);

  // 1. Start activation session on modal open
  useEffect(() => {
    let pollTimer = null;

    if (open) {
      setError('');
      setVerifiedCard(null);
      setManualInput('');
      setUseCamera(false);
      setFormData({
        business_id: '',
        client_name: '',
        destination_url: '',
        purpose: 'Client Website',
        notes: '',
      });

      const initSession = async () => {
        try {
          setLoadingSession(true);
          const [sessRes, bizRes] = await Promise.all([
            activationSessionService.start(),
            businessService.list(),
          ]);
          const newSession = sessRes.data;
          setSession(newSession);
          setBusinesses(bizRes.data.results || bizRes.data);

          // Start polling session status in case admin scans on mobile phone
          pollTimer = setInterval(async () => {
            try {
              const statusRes = await activationSessionService.checkStatus(newSession.id);
              if (statusRes.data.status === 'SCAN_VERIFIED') {
                setSession(statusRes.data);
                setVerifiedCard({ card_id: statusRes.data.card_id });
                clearInterval(pollTimer);
              }
            } catch (err) {
              // ignore polling error
            }
          }, 1500);

        } catch (err) {
          console.error(err);
          setError('Failed to initiate activation session. Please try again.');
        } finally {
          setLoadingSession(false);
        }
      };

      initSession();
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      stopCamera();
    };
  }, [open]);

  // Camera video stream handling
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
      setError("Camera scanner unavailable. You can use an external scanner or enter the physical card ID below.");
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

  // 2. Verify physical scan
  const handleVerifyScan = async (scannedId) => {
    const raw = (scannedId || manualInput).trim();
    if (!raw || !session) return;

    try {
      setVerifyingScan(true);
      setError('');
      const res = await activationSessionService.verifyScan(session.id, raw);
      setSession(res.data.session);
      setVerifiedCard(res.data.card);
      stopCamera();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Physical scan verification failed. Make sure the card exists in inventory.");
    } finally {
      setVerifyingScan(false);
    }
  };

  // 3. Complete activation
  const handleCompleteActivation = async (e) => {
    e.preventDefault();
    if (!formData.destination_url) {
      setError("Destination URL is required.");
      return;
    }

    try {
      setCompleting(true);
      setError('');
      await activationSessionService.complete(session.id, formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to activate card.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeScannerIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Physical QR / NFC Card Activation
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ py: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

        {loadingSession ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Initializing secure admin activation session...
            </Typography>
          </Box>
        ) : !verifiedCard ? (
          /* STEP 1: WAITING FOR PHYSICAL SCAN */
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                border: '2px dashed #93c5fd',
              }}
            >
              <QrCodeScannerIcon sx={{ fontSize: 36 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#0f172a' }}>
              Scan Physical Card Now
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 3 }}>
              The administrator must physically scan or tap the QR/NFC card to verify physical possession before activation is permitted.
            </Typography>

            {/* Session Token Chip */}
            <Box sx={{ mb: 3 }}>
              <Chip
                label={`Activation Session: ${session?.session_token?.slice(0, 12)}...`}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontWeight: 600 }}
              />
            </Box>

            {/* Device Camera Scanner */}
            {useCamera ? (
              <Box sx={{ mb: 3, position: 'relative', width: '100%', maxWidth: 360, mx: 'auto' }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', borderRadius: 12, border: '2px solid #2563eb' }}
                  playsInline
                />
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<VideocamOffIcon />}
                  onClick={stopCamera}
                  sx={{ mt: 1 }}
                >
                  Turn Off Camera
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<VideocamIcon />}
                onClick={startCamera}
                sx={{ mb: 3 }}
              >
                Scan with Device Camera
              </Button>
            )}

            {/* Hardware Scanner / Card ID input */}
            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                OR USE HARDWARE SCANNER / CARD ID FROM PHYSICAL CARD:
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. A7K92X or full scanned URL"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleVerifyScan();
                    }
                  }}
                  autoFocus
                />
                <Button
                  variant="contained"
                  onClick={() => handleVerifyScan()}
                  disabled={verifyingScan || !manualInput.trim()}
                  startIcon={verifyingScan && <CircularProgress size={16} />}
                >
                  Verify Scan
                </Button>
              </Stack>
            </Paper>
          </Box>
        ) : (
          /* STEP 2: PHYSICAL SCAN VERIFIED - CONFIGURE DESTINATION */
          <form onSubmit={handleCompleteActivation}>
            <Alert
              icon={<CheckCircleIcon fontSize="inherit" />}
              severity="success"
              sx={{ mb: 3, alignItems: 'center' }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                QR SCAN VERIFIED ✓
              </Typography>
              <Typography variant="body2">
                Physical card <strong>{verifiedCard.card_id}</strong> is verified. You can now configure its destination.
              </Typography>
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                ASSIGN TO CLIENT / BUSINESS:
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Select Existing Client"
                  value={formData.business_id}
                  onChange={(e) => setFormData({ ...formData, business_id: e.target.value, client_name: '' })}
                >
                  <MenuItem value="">-- Or enter new client below --</MenuItem>
                  {businesses.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  size="small"
                  label="Or New Client Name"
                  placeholder="e.g. Blue Sky Bistro"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value, business_id: '' })}
                />
              </Stack>
            </Box>

            <TextField
              fullWidth
              label="Destination URL"
              placeholder="https://clientwebsite.com"
              value={formData.destination_url}
              onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
              margin="normal"
              required
              helperText="The permanent QR / NFC card will dynamically route directly to this URL."
              autoFocus
            />

            <TextField
              fullWidth
              size="small"
              label="Card Purpose / Deployment Tag"
              placeholder="e.g. Dining Table 4, Reception Desk Tap Tag"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Notes"
              placeholder="Staff deployment notes or card physical location"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              margin="normal"
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button onClick={onClose} disabled={completing}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={completing}
                startIcon={completing ? <CircularProgress size={18} /> : <CheckCircleIcon />}
                sx={{ px: 3, fontWeight: 700 }}
              >
                Activate QR
              </Button>
            </Box>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
