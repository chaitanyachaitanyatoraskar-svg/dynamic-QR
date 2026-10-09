import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Stack, Divider, IconButton,
  CircularProgress, Tooltip, ToggleButton, ToggleButtonGroup, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import LaptopIcon from '@mui/icons-material/Laptop';
import { cardService } from '../services/api';

const LAN_IP = '192.168.0.153';

export const QRPreviewModal = ({ open, onClose, card }) => {
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [scanMode, setScanMode] = useState('local'); // 'local' or 'lan'

  if (!card) return null;

  const targetId = card.id || card.card_id;
  const isLan = scanMode === 'lan';
  const customDomain = isLan ? `http://${LAN_IP}:3030` : null;

  const currentPermanentUrl = isLan
    ? `http://${LAN_IP}:3030/q/${card.card_id}`
    : (card.permanent_url || `http://localhost:3030/q/${card.card_id}`);

  const qrPngUrl = cardService.downloadQrUrl(targetId, 'png', customDomain);
  const qrSvgUrl = cardService.downloadQrUrl(targetId, 'svg', customDomain);

  const copyUrl = () => {
    navigator.clipboard.writeText(currentPermanentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setImgLoaded(false);
      setImgError(false);
      setScanMode(newMode);
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

        {/* Scan Mode Switcher (Localhost vs Wi-Fi Mobile) */}
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={scanMode}
            exclusive
            onChange={handleModeChange}
            size="small"
            fullWidth
          >
            <ToggleButton value="local" sx={{ textTransform: 'none', py: 0.5, fontSize: '0.75rem' }}>
              <LaptopIcon fontSize="small" sx={{ mr: 0.5 }} /> PC / Localhost
            </ToggleButton>
            <ToggleButton value="lan" sx={{ textTransform: 'none', py: 0.5, fontSize: '0.75rem' }}>
              <PhoneIphoneIcon fontSize="small" sx={{ mr: 0.5 }} /> Mobile (Wi-Fi Scan)
            </ToggleButton>
          </ToggleButtonGroup>
          {isLan && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
              Encoded for Wi-Fi devices via {LAN_IP}:3030
            </Typography>
          )}
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
              <Typography variant="caption" color="text.secondary">Rendering QR code...</Typography>
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
          Redirect Scan URL
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
          <Tooltip title={copied ? "Copied!" : "Copy URL"}>
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
