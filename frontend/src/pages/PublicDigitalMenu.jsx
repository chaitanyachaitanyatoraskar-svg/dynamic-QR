import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, TextField, Chip, Stack,
  Card, CardContent, Divider, CircularProgress, IconButton,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import StarRateIcon from '@mui/icons-material/StarRate';
import StorefrontIcon from '@mui/icons-material/Storefront';

import { menuService, analyticsService } from '../services/api';

export const PublicDigitalMenu = () => {
  const { slug } = useParams();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res = await menuService.getPublic(slug);
        setMenu(res.data);

        // Record telemetry
        analyticsService.trackEvent({
          business_slug: slug,
          event_type: 'MENU_VIEW',
          destination: 'DIGITAL_MENU',
        }).catch(() => {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchMenu();
    }
  }, [slug]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const categories = menu?.categories || [];
  const filteredCategories = categories.map((cat) => {
    if (selectedCategory !== 'ALL' && cat.name !== selectedCategory) {
      return null;
    }
    const filteredItems = (cat.items || []).filter((item) => {
      if (!item.is_available) return false;
      if (!search) return true;
      return (
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
      );
    });
    return { ...cat, items: filteredItems };
  }).filter(Boolean);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', pb: 8 }}>
      {/* Mobile-first Header */}
      <Box
        sx={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          pt: 4,
          pb: 3,
          px: 2,
          borderBottom: '1px solid #1e293b',
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
                {menu?.business_name || 'Restaurant Menu'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                {menu?.title || 'Digital Dine-in Menu'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                component={RouterLink}
                to={`/business/${slug}`}
                sx={{ color: '#fff', borderColor: '#334155', minWidth: 'auto', px: 1.5 }}
                title="Business Info"
              >
                <StorefrontIcon fontSize="small" />
              </Button>
              <Button
                variant="contained"
                size="small"
                color="secondary"
                component={RouterLink}
                to={`/business/${slug}/reviews`}
                sx={{ minWidth: 'auto', px: 1.5 }}
                title="Leave a Review"
              >
                <StarRateIcon fontSize="small" />
              </Button>
            </Stack>
          </Box>

          {/* Search bar */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search appetizers, mains, beverages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              backgroundColor: '#1e293b',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                color: '#ffffff',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#475569' },
              },
            }}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} />,
            }}
          />
        </Container>
      </Box>

      {/* Category Pills Slider */}
      <Box
        sx={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          py: 1.5,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Container maxWidth="sm">
          <Stack
            direction="row"
            spacing={1}
            sx={{
              overflowX: 'auto',
              py: 0.5,
              '::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            <Chip
              label="All Items"
              clickable
              color={selectedCategory === 'ALL' ? 'primary' : 'default'}
              variant={selectedCategory === 'ALL' ? 'filled' : 'outlined'}
              onClick={() => setSelectedCategory('ALL')}
              sx={{ fontWeight: 600 }}
            />
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                clickable
                color={selectedCategory === c.name ? 'primary' : 'default'}
                variant={selectedCategory === c.name ? 'filled' : 'outlined'}
                onClick={() => setSelectedCategory(c.name)}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Menu Categories and Dishes */}
      <Container maxWidth="sm" sx={{ mt: 3 }}>
        {filteredCategories.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No matching dishes found.
            </Typography>
          </Box>
        ) : (
          filteredCategories.map((cat) => (
            <Box key={cat.id} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a' }}>
                {cat.name}
              </Typography>

              <Stack spacing={2}>
                {cat.items?.map((item) => (
                  <Card key={item.id} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {item.name}
                          </Typography>
                          {item.is_vegetarian && (
                            <Chip label="VEG" size="small" color="success" sx={{ fontSize: '0.625rem', height: 18 }} />
                          )}
                          {item.is_spicy && (
                            <Chip label="SPICY 🌶" size="small" color="error" sx={{ fontSize: '0.625rem', height: 18 }} />
                          )}
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', ml: 1 }}>
                          ${parseFloat(item.price).toFixed(2)}
                        </Typography>
                      </Box>
                      {item.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                          {item.description}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          ))
        )}
      </Container>
    </Box>
  );
};
