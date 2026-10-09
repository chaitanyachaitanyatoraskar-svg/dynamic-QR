import React from 'react';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Stack, Chip, Divider, Paper
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ContactlessIcon from '@mui/icons-material/Contactless';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CachedIcon from '@mui/icons-material/Cached';
import SecurityIcon from '@mui/icons-material/Security';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LoginIcon from '@mui/icons-material/Login';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

export const LandingPage = () => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Top Navbar */}
      <Box sx={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', py: 2 }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                justifyContent: 'center',
              }}
            >
              <ContactlessIcon />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Dynamic NFC + QR Platform
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/login"
              startIcon={<SecurityIcon />}
            >
              Portal Sign In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: 8 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 840, mx: 'auto', mb: 6 }}>
          <Chip
            label="Permanent Physical Hardware • Merged Admin First-Scan Activation"
            color="secondary"
            size="small"
            sx={{ mb: 2.5, fontWeight: 700 }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
              fontSize: { xs: '2.25rem', md: '3.5rem' },
              mb: 3,
            }}
          >
            Physical Cards Printed Once.{' '}
            <Box component="span" sx={{ color: 'secondary.main' }}>
              Dynamic Destinations Controlled Forever.
            </Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 4, lineHeight: 1.6 }}>
            Never reprint a physical QR code when a client updates their website, menu, or booking URL. Physical cards are provisioned in inventory and activated only when an authorized administrator physically scans or taps the card.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              color="primary"
              component={RouterLink}
              to="/login"
              endIcon={<ArrowForwardIcon />}
              sx={{ py: 1.5, px: 4, fontSize: '1rem', fontWeight: 700 }}
            >
              Sign In to Portal
            </Button>
          </Stack>
        </Box>

        {/* 3-Step Lifecycle Architecture */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: 4,
            mb: 8,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, textAlign: 'center', color: '#60a5fa' }}>
            The Authoritative 3-Step Lifecycle
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', color: '#cbd5e1', maxWidth: 700, mx: 'auto', mb: 4 }}>
            Preventing unverified activations, inventory mix-ups, and unauthorized claims.
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 3.5 }}>
              <Box sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, textAlign: 'center', height: '100%' }}>
                <QrCode2Icon sx={{ fontSize: 40, color: '#38bdf8', mb: 1.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>1. Inventory</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Cards are generated in batches with permanent IDs & QR codes. They start in <strong>UNACTIVATED</strong> status. Public scans show "Not Activated".
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 0.75 }} sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
              <ArrowForwardIcon sx={{ color: '#64748b' }} />
            </Grid>
            <Grid size={{ xs: 12, md: 3.5 }}>
              <Box sx={{ p: 3, backgroundColor: 'rgba(37,99,235,0.25)', border: '1px solid #3b82f6', borderRadius: 3, textAlign: 'center', height: '100%' }}>
                <QrCodeScannerIcon sx={{ fontSize: 40, color: '#60a5fa', mb: 1.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>2. Physical First-Scan</Typography>
                <Typography variant="body2" sx={{ color: '#bfdbfe' }}>
                  Admin initiates an activation session and physically scans/taps the card. The system verifies physical possession before permitting activation.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 0.75 }} sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
              <ArrowForwardIcon sx={{ color: '#64748b' }} />
            </Grid>
            <Grid size={{ xs: 12, md: 3.5 }}>
              <Box sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, textAlign: 'center', height: '100%' }}>
                <CachedIcon sx={{ fontSize: 40, color: '#4ade80', mb: 1.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>3. Live Direct Routing</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Admin assigns client & destination URL. Card becomes <strong>ACTIVE</strong>. All future public scans/taps redirect directly via HTTP 302.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Feature Highlights */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <SecurityIcon sx={{ fontSize: 32, color: '#2563eb', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Physical Proof Mandatory
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Administrators cannot activate cards simply by typing an alphanumeric ID into a form. The physical hardware must be scanned to establish chain-of-custody.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <CachedIcon sx={{ fontSize: 32, color: '#10b981', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Dynamic Destination Updates
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Update client destination URLs anytime from the management console. Changing destination URLs does not require re-printing or re-scanning.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <ContactlessIcon sx={{ fontSize: 32, color: '#8b5cf6', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Dual NFC & QR Compatibility
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The identical permanent URL is printed as a QR code and encoded onto the internal NFC chip, delivering a unified physical-to-digital routing experience.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
