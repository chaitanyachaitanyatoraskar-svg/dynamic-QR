import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Card, CardContent,
  Stack, Divider, Grid, CircularProgress, Paper
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import StarRateIcon from '@mui/icons-material/StarRate';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NavigationIcon from '@mui/icons-material/Navigation';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { businessService, analyticsService } from '../services/api';

export const PublicBusinessProfile = () => {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        const res = await businessService.getPublic(slug);
        setBusiness(res.data);

        analyticsService.trackEvent({
          business_slug: slug,
          event_type: 'PAGE_VIEW',
          destination: 'BUSINESS_PROFILE',
        }).catch(() => {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchBusiness();
    }
  }, [slug]);

  const handleTrackAction = (eventType, dest) => {
    analyticsService.trackEvent({
      business_slug: slug,
      event_type: eventType,
      destination: dest,
    }).catch(() => {});
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!business) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Business not found.</Typography>
      </Box>
    );
  }

  const hours = business.opening_hours || {};

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', pb: 8 }}>
      {/* Cover / Header */}
      <Box
        sx={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          pt: 6,
          pb: 5,
          px: 2,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: '#ffffff' }}>
            {business.name}
          </Typography>
          <Typography variant="body1" sx={{ color: '#cbd5e1', maxWidth: 480, mx: 'auto', mb: 2 }}>
            {business.description || 'Welcome to our venue.'}
          </Typography>
          {business.address && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: '#94a3b8' }}>
              <LocationOnIcon fontSize="small" />
              <Typography variant="caption">{business.address}, {business.city}</Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* Action Buttons Hub */}
      <Container maxWidth="sm" sx={{ mt: -3 }}>
        <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
          <Stack spacing={1.5}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              color="primary"
              startIcon={<RestaurantMenuIcon />}
              component={RouterLink}
              to={`/business/${slug}/menu`}
              sx={{ py: 1.5, fontWeight: 700 }}
            >
              View Digital Menu
            </Button>

            <Button
              fullWidth
              variant="contained"
              size="large"
              color="secondary"
              startIcon={<StarRateIcon />}
              component={RouterLink}
              to={`/business/${slug}/reviews`}
              sx={{ py: 1.5, fontWeight: 700 }}
            >
              Leave a Review
            </Button>

            <Grid container spacing={1.5} sx={{ pt: 1 }}>
              {business.phone && (
                <Grid size={{ xs: 4 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="inherit"
                    startIcon={<PhoneIcon />}
                    href={`tel:${business.phone}`}
                    onClick={() => handleTrackAction('CALL_CLICK', `tel:${business.phone}`)}
                    sx={{ py: 1.2, borderColor: '#cbd5e1', fontSize: '0.8125rem' }}
                  >
                    Call
                  </Button>
                </Grid>
              )}
              {business.whatsapp && (
                <Grid size={{ xs: 4 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="success"
                    startIcon={<WhatsAppIcon />}
                    href={`https://wa.me/${business.whatsapp}`}
                    target="_blank"
                    onClick={() => handleTrackAction('WHATSAPP_CLICK', `wa.me/${business.whatsapp}`)}
                    sx={{ py: 1.2, fontSize: '0.8125rem' }}
                  >
                    WhatsApp
                  </Button>
                </Grid>
              )}
              {business.google_maps_url && (
                <Grid size={{ xs: 4 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="inherit"
                    startIcon={<NavigationIcon />}
                    href={business.google_maps_url}
                    target="_blank"
                    onClick={() => handleTrackAction('DIRECTIONS_CLICK', business.google_maps_url)}
                    sx={{ py: 1.2, borderColor: '#cbd5e1', fontSize: '0.8125rem' }}
                  >
                    Directions
                  </Button>
                </Grid>
              )}
            </Grid>
          </Stack>
        </Paper>

        {/* Operating Hours Card */}
        {Object.keys(hours).length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccessTimeIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Opening Hours
                </Typography>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <Stack spacing={1}>
                {Object.entries(hours).map(([day, time]) => (
                  <Box key={day} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{day}</Typography>
                    <Typography variant="body2" color="text.secondary">{time}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};
