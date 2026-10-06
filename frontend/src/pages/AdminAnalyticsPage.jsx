import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  CircularProgress, Divider, Stack
} from '@mui/material';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import StarRateIcon from '@mui/icons-material/StarRate';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import NavigationIcon from '@mui/icons-material/Navigation';

import { analyticsService } from '../services/api';
import { StatCard } from '../components/StatCard';

export const AdminAnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [sumRes, evtRes] = await Promise.all([
          analyticsService.getSummary(),
          analyticsService.getEvents(),
        ]);
        setSummary(sumRes.data);
        setEvents(evtRes.data.results || evtRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Scan Analytics & Event Telemetry
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track physical-to-digital interactions across all NFC taps and QR code scans
        </Typography>
      </Box>

      {/* Metrics Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Physical Scans"
            value={summary?.total_scans || 0}
            subtitle={`${summary?.today_scans || 0} scans recorded today`}
            icon={TouchAppIcon}
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Digital Menu Views"
            value={summary?.menu_views || 0}
            subtitle="Engaged diner visits"
            icon={RestaurantMenuIcon}
            color="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Google Review Clicks"
            value={summary?.review_clicks || 0}
            subtitle="Verified review prompts"
            icon={StarRateIcon}
            color="#f59e0b"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <StatCard
            title="WhatsApp Inquiries"
            value={summary?.whatsapp_clicks || 0}
            subtitle="Direct chat opens"
            icon={WhatsAppIcon}
            color="#16a34a"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <StatCard
            title="Phone Calls Initiated"
            value={summary?.call_clicks || 0}
            subtitle="Tap-to-call conversions"
            icon={PhoneIcon}
            color="#6366f1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <StatCard
            title="Directions / Map Taps"
            value={summary?.directions_clicks || 0}
            subtitle="Foot-traffic routing"
            icon={NavigationIcon}
            color="#0f172a"
          />
        </Grid>
      </Grid>

      {/* Device breakdown & Daily activity */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Device Breakdown
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {summary?.device_breakdown?.map((d) => (
                <Box key={d.device_type} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.device_type}</Typography>
                  <Typography variant="body2" color="text.secondary">{d.count} scans</Typography>
                </Box>
              ))}
              {(!summary?.device_breakdown || summary.device_breakdown.length === 0) && (
                <Typography variant="body2" color="text.secondary">No device data captured yet.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Recent Daily Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {summary?.daily_breakdown?.map((day) => (
                <Box key={day.date} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="body2">{day.date}</Typography>
                  <Chip label={`${day.count} scans`} size="small" color="primary" />
                </Box>
              ))}
              {(!summary?.daily_breakdown || summary.daily_breakdown.length === 0) && (
                <Typography variant="body2" color="text.secondary">No daily activity recorded yet.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Telemetry Stream */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Live Telemetry Stream
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>TIMESTAMP</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>EVENT TYPE</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>CARD ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>BUSINESS</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>DEVICE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No scan events captured yet. Scan a card to generate live telemetry.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell variant="body2">{new Date(e.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={e.event_type} size="small" variant="outlined" color="secondary" />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{e.card_id || 'Direct'}</TableCell>
                      <TableCell>{e.business_name || 'System'}</TableCell>
                      <TableCell variant="body2">{e.device_type}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
