import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Stack, Divider, IconButton,
  CircularProgress, Tooltip, ToggleButton, ToggleButtonGroup, Chip,
  TextField, InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PublicIcon from '@mui/icons-material/Public';
import LanguageIcon from '@mui/icons-material/Language';
import LaptopIcon from '@mui/icons-material/Laptop';
import EditIcon from '@mui/icons-material/Edit';
import { cardService } from '../services/api';

const VERCEL_PRODUCTION_DOMAIN = 'https://dynamic-qr-nu-five.vercel.app';

export const QRPreviewModal = ({ open, onClose, card }) => {
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Determine default domain: if on Vercel or custom live domain, use window.location.origin
  const detectedOrigin = (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost'))
    ? window.location.origin
    : VERCEL_PRODUCTION_DOMAIN;

  // Domain modes: 'production' (default), 'custom', 'local'
  const [domainMode, setDomainMode] = useState('production');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [isEditingDomain, setIsEditingDomain] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [domainMode, customDomainInput, card?.id]);

  if (!card) return null;

  const targetId = card.id || card.card_id;

  // Compute active base domain
  let activeDomain = detectedOrigin;
  if (domainMode === 'local') {
    activeDomain = 'http://localhost:3030';
  } else if (domainMode === 'custom' && customDomainInput.trim()) {
    activeDomain = customDomainInput.trim().replace(/\/+$/, '');
  }

  // The final scan URL embedded in physical media
  const currentPermanentUrl = `${activeDomain}/q/${card.card_id}`;

  const qrPngUrl = cardService.downloadQrUrl(targetId, 'png', activeDomain);
  const qrSvgUrl = cardService.downloadQrUrl(targetId, 'svg', activeDomain);

  const copyUrl = () => {
    navigator.clipboard.writeText(currentPermanentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setDomainMode(newMode);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCode2Icon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Card QR: {card.card_id}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ textAlign: 'center', py: 2.5 }}>
        {/* Destination Target Info */}
        {card.destination_url ? (
          <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', textAlign: 'left' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                Active Client Destination
              </Typography>
              <Chip label={card.status} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#15803d', wordBreak: 'break-all' }}>
              {card.destination_url}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.72rem' }}>
              Anyone scanning this QR will automatically redirect here.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#fffbeb', borderRadius: 2, border: '1px solid #fef3c7', textAlign: 'left' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
              Status: {card.status}
            </Typography>
            <Typography variant="body2" sx={{ color: '#92400e' }}>
              No redirection link configured yet.
            </Typography>
          </Box>
        )}

        {/* Domain Selection Tabs */}
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={domainMode}
            exclusive
            onChange={handleModeChange}
            size="small"
            fullWidth
            sx={{ mb: 1 }}
          >
            <ToggleButton value="production" sx={{ textTransform: 'none', py: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
              <PublicIcon fontSize="small" sx={{ mr: 0.5 }} /> Live Commercial
            </ToggleButton>
            <ToggleButton value="custom" sx={{ textTransform: 'none', py: 0.5, fontSize: '0.75rem' }}>
              <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} /> Custom Domain
            </ToggleButton>
            <ToggleButton value="local" sx={{ textTransform: 'none', py: 0.5, fontSize: '0.75rem' }}>
              <LaptopIcon fontSize="small" sx={{ mr: 0.5 }} /> Localhost Dev
            </ToggleButton>
          </ToggleButtonGroup>

          {domainMode === 'custom' && (
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. https://mybrandqr.com"
              value={customDomainInput}
              onChange={(e) => setCustomDomainInput(e.target.value)}
              helperText="Enter your brand or custom domain for printing"
              sx={{ mt: 1, mb: 1 }}
            />
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
            <Chip
              label={domainMode === 'production' ? "Commercial Print Ready" : domainMode === 'custom' ? "Custom Brand URL" : "Development Only"}
              size="small"
              color={domainMode === 'production' ? "primary" : domainMode === 'custom' ? "secondary" : "default"}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        </Box>

        {/* QR Code Container */}
        <Box
          sx={{
            p: 2,
            border: '2px dashed #cbd5e1',
            borderRadius: 3,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            mb: 2,
            minWidth: 220,
            minHeight: 220,
            position: 'relative',
          }}
        >
          {!imgLoaded && !imgError && (
            <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={32} />
              <Typography variant="caption" color="text.secondary">Generating print-ready QR...</Typography>
            </Box>
          )}

          {imgError ? (
            <Typography variant="body2" color="error">
              Unable to load QR image.
            </Typography>
          ) : (
            <img
              key={qrPngUrl}
              src={qrPngUrl}
              alt={`QR code for ${card.card_id}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
              style={{
                width: 200,
                height: 200,
                display: imgLoaded ? 'block' : 'none',
                borderRadius: 8,
              }}
            />
          )}
        </Box>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          Redirect Scan URL (Printed on Card)
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f1f5f9',
            px: 1.5,
            py: 1,
            borderRadius: 2,
            wordBreak: 'break-all',
            fontSize: '0.8125rem',
            fontFamily: 'monospace',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            mb: 1.5,
          }}
        >
          <span style={{ fontWeight: 600 }}>{currentPermanentUrl}</span>
          <Tooltip title={copied ? "Copied!" : "Copy permanent URL"}>
            <IconButton size="small" onClick={copyUrl} color={copied ? "success" : "default"}>
              {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Test Scan / Redirection Button */}
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          size="small"
          endIcon={<OpenInNewIcon fontSize="small" />}
          href={currentPermanentUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Test Scan Redirection (Open Link)
        </Button>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          href={`${qrSvgUrl}&download=1`}
          download={`qr_${card.card_id}.svg`}
        >
          Download SVG
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<DownloadIcon />}
          href={`${qrPngUrl}&download=1`}
          download={`qr_${card.card_id}.png`}
        >
          Download PNG
        </Button>
      </DialogActions>
    </Dialog>
  );
};
