import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Stack, Divider, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { cardService } from '../services/api';

export const QRPreviewModal = ({ open, onClose, card }) => {
  if (!card) return null;

  const qrPngUrl = cardService.downloadQrUrl(card.id, 'png');
  const qrSvgUrl = cardService.downloadQrUrl(card.id, 'svg');

  const copyUrl = () => {
    navigator.clipboard.writeText(card.permanent_url);
    alert('Permanent URL copied to clipboard: ' + card.permanent_url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCode2Icon color="primary" />
          <Typography variant="h6">Card QR: {card.card_id}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
        <Box
          sx={{
            p: 2,
            border: '2px dashed #e2e8f0',
            borderRadius: 3,
            display: 'inline-block',
            backgroundColor: '#ffffff',
            mb: 2,
          }}
        >
          <img
            src={qrPngUrl}
            alt={`QR code for ${card.card_id}`}
            style={{ width: 220, height: 220, display: 'block' }}
          />
        </Box>

        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
          Permanent Physical URL:
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f1f5f9',
            p: 1,
            borderRadius: 1.5,
            wordBreak: 'break-all',
            fontSize: '0.8125rem',
            fontFamily: 'monospace',
            color: '#1e293b',
          }}
        >
          <span>{card.permanent_url}</span>
          <IconButton size="small" onClick={copyUrl} sx={{ ml: 1 }}>
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          This QR code is printed once on the physical card or encoded on the NFC chip. It never changes.
        </Typography>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          href={qrSvgUrl}
          download={`qr_${card.card_id}.svg`}
        >
          Download SVG
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<DownloadIcon />}
          href={qrPngUrl}
          download={`qr_${card.card_id}.png`}
        >
          Download PNG
        </Button>
      </DialogActions>
    </Dialog>
  );
};
