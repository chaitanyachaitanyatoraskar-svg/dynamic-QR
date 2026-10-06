import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button,
  Stack, Chip, Divider, CircularProgress
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import QrCodeIcon from '@mui/icons-material/QrCode';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import LaunchIcon from '@mui/icons-material/Launch';
import StarRateIcon from '@mui/icons-material/StarRate';
import { Link as RouterLink } from 'react-router-dom';

import { businessService, cardService, analyticsService } from '../services/api';
import { StatCard } from '../components/StatCard';

export const BusinessDashboard = () => {
  const [business, setBusiness] = useState(null);
  const [cards, setCards] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bizRes, cardsRes, analyticsRes] = await Promise.all([
          businessService.list(),
          cardService.list(),
          analyticsService.getSummary(),
        ]);
        const bizList = bizRes.data.results || bizRes.data;
        if (bizList.length > 0) {
          setBusiness(bizList[0]);
        }
        setCards(cardsRes.data.results || cardsRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error("Business dashboard error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {business?.name || 'My Business Dashboard'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your physical NFC/QR card deployments, mobile menu, and customer engagements
          </Typography>
        </Box>
        {business && (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LaunchIcon />}
              component={RouterLink}
              to={`/business/${business.slug}`}
              target="_blank"
            >
              Public Profile
            </Button>
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<RestaurantMenuIcon />}
              component={RouterLink}
              to={`/business/${business.slug}/menu`}
              target="_blank"
            >
              Live Mobile Menu
            </Button>
          </Stack>
        )}
      </Box>

      {/* Metrics Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Scans"
            value={analytics?.total_scans || 0}
            subtitle="Customer taps & scans"
            icon={TouchAppIcon}
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active NFC Cards"
            value={cards.length}
            subtitle="Physical cards deployed"
            icon={QrCodeIcon}
            color="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Menu Views"
            value={analytics?.menu_views || 0}
            subtitle="Digital menu opens"
            icon={RestaurantMenuIcon}
            color="#f59e0b"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Review Clicks"
            value={analytics?.review_clicks || 0}
            subtitle="Google Review clicks"
            icon={StarRateIcon}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      {/* Quick Action Panels */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Digital Menu Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update food items, prices, dietary badges, and item availability in real-time. Customers scanning your physical QR code instantly view updates without reprinting.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/dashboard/menu"
                startIcon={<RestaurantMenuIcon />}
              >
                Open Menu Editor
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                My Physical Hardware Cards
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View your deployed cards, print backup QR codes, monitor individual table scan counts, or inspect destinations.
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                component={RouterLink}
                to="/dashboard/cards"
                startIcon={<QrCodeIcon />}
              >
                View Assigned Cards
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
