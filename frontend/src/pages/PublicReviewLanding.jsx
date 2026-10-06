import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Paper, Rating,
  Stack, CircularProgress
} from '@mui/material';
import StarRateIcon from '@mui/icons-material/StarRate';
import StorefrontIcon from '@mui/icons-material/Storefront';

import { businessService, analyticsService } from '../services/api';

export const PublicReviewLanding = () => {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        const res = await businessService.getPublic(slug);
        setBusiness(res.data);
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

  const handleReviewClick = () => {
    analyticsService.trackEvent({
      business_slug: slug,
      event_type: 'REVIEW_CLICK',
      destination: business?.google_review_url || 'GOOGLE_REVIEWS',
    }).catch(() => {});

    if (business?.google_review_url) {
      window.location.href = business.google_review_url;
    } else {
      alert("No review link configured for this business yet.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            backgroundColor: '#ffffff',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#f59e0b',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2.5,
            }}
          >
            <StarRateIcon fontSize="large" />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5, fontWeight: 600 }}>
            Customer Feedback
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#0f172a' }}>
            How was your experience at {business?.name}?
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your feedback helps our team maintain exceptional standards. Tap below to share your experience on Google!
          </Typography>

          <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'center' }}>
            <Rating
              value={rating}
              onChange={(e, val) => setRating(val || 5)}
              size="large"
              sx={{ color: '#f59e0b' }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            color="primary"
            startIcon={<StarRateIcon />}
            onClick={handleReviewClick}
            sx={{ py: 1.5, fontWeight: 700, mb: 2 }}
          >
            Leave a Google Review
          </Button>

          <Button
            component={RouterLink}
            to={`/business/${slug}`}
            size="small"
            color="inherit"
            startIcon={<StorefrontIcon />}
          >
            Visit Business Profile
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};
