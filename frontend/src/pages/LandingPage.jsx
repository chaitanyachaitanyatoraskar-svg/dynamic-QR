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
              Dynamic QR & NFC
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/login"
              startIcon={<LoginIcon />}
            >
              Portal Login
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: 8 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 840, mx: 'auto', mb: 6 }}>
          <Chip
            label="Permanent Physical QR • Dynamic Cloud Routing"
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
            Physical NFC & QR Cards Printed Once.{' '}
            <Box component="span" sx={{ color: 'secondary.main' }}>
              Destinations Controlled Forever.
            </Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 4, lineHeight: 1.6 }}>
            Never reprint a physical QR code when a restaurant changes its menu, a salon updates its booking link, or a business rebrands. One permanent card ID handles dynamic routing with multi-tenant isolation and scan analytics.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              color="primary"
              component={RouterLink}
              to="/login"
              endIcon={<ArrowForwardIcon />}
              sx={{ py: 1.5, px: 3.5, fontSize: '1rem' }}
            >
              Access Admin & Tenant Portal
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="inherit"
              component={RouterLink}
              to="/go/A7K92X"
              startIcon={<QrCode2Icon />}
              sx={{ py: 1.5, px: 3.5, borderColor: '#cbd5e1' }}
            >
              Test Permanent Redirect (/go/A7K92X)
            </Button>
          </Stack>
        </Box>

        {/* Fundamental Architectural Concept Card */}
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
            The Fundamental Architectural Principle
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', color: '#cbd5e1', maxWidth: 700, mx: 'auto', mb: 4 }}>
            The physical QR code contains solely our domain URL (e.g. <code>https://yourdomain.com/go/A7K92X</code>).
            Our high-throughput backend resolves the card and dispatches visitors dynamically.
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ p: 2.5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, textAlign: 'center' }}>
                <QrCode2Icon sx={{ fontSize: 36, color: '#38bdf8', mb: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>1. Physical Card</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Permanent Card ID: A7K92X</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 1 }} sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
              <ArrowForwardIcon sx={{ color: '#64748b' }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 2.5, backgroundColor: 'rgba(37,99,235,0.25)', border: '1px solid #3b82f6', borderRadius: 3, textAlign: 'center' }}>
                <CachedIcon sx={{ fontSize: 36, color: '#60a5fa', mb: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>2. Dynamic Engine</Typography>
                <Typography variant="caption" sx={{ color: '#bfdbfe', display: 'block' }}>/go/A7K92X Backend Lookup & Telemetry</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 1 }} sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
              <ArrowForwardIcon sx={{ color: '#64748b' }} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ p: 2.5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, textAlign: 'center' }}>
                <StorefrontIcon sx={{ fontSize: 36, color: '#4ade80', mb: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>3. Configured Destination</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Digital Menu / Profile / Reviews</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Live Demo Cards Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
            Interactive Demo Permanent Cards
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
            Click any permanent card link below to see the dynamic routing engine resolve the active destination in real time:
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Card A7K92X</Typography>
                    <Chip label="ACTIVE" color="success" size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Assigned to: <strong>ABC Restaurant</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                    Destination: <strong>Digital Menu</strong> (Mobile-first food menu with categories, veg/spicy icons, and pricing).
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    component={RouterLink}
                    to="/go/A7K92X"
                  >
                    Simulate NFC Tap / Scan
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Card C52LM8</Typography>
                    <Chip label="ACTIVE" color="success" size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Assigned to: <strong>Urban Salon & Spa</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                    Destination: <strong>Business Profile</strong> (Hours, direct WhatsApp, Phone, Map, and booking).
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    component={RouterLink}
                    to="/go/C52LM8"
                  >
                    Simulate NFC Tap / Scan
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Card B81PQ4</Typography>
                    <Chip label="AVAILABLE" color="info" size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Assigned to: <em>Unassigned Inventory</em>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                    Warehouse inventory card ready for provisioning. Scanning gracefully displays status page.
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="inherit"
                    component={RouterLink}
                    to="/go/B81PQ4"
                  >
                    Simulate Scan (Unassigned)
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};
