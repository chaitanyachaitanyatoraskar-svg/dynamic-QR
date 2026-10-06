import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider,
  IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Chip, Button, useMediaQuery, useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import QrCodeIcon from '@mui/icons-material/QrCode';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import ContactlessIcon from '@mui/icons-material/Contactless';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 250;

export const DashboardLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNav = [
    { text: 'Overview', icon: DashboardIcon, path: '/admin/dashboard' },
    { text: 'Card Inventory', icon: QrCodeIcon, path: '/admin/cards' },
    { text: 'Businesses', icon: BusinessIcon, path: '/admin/businesses' },
    { text: 'Platform Analytics', icon: BarChartIcon, path: '/admin/analytics' },
    { text: 'Audit Logs', icon: HistoryIcon, path: '/admin/audit' },
  ];

  const ownerNav = [
    { text: 'Business Overview', icon: DashboardIcon, path: '/dashboard' },
    { text: 'My NFC / QR Cards', icon: QrCodeIcon, path: '/dashboard/cards' },
    { text: 'Digital Menu', icon: RestaurantMenuIcon, path: '/dashboard/menu' },
    { text: 'Scan Analytics', icon: BarChartIcon, path: '/dashboard/analytics' },
  ];

  const navItems = isSuperAdmin ? adminNav : ownerNav;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
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
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Dynamic QR
          </Typography>
          <Typography variant="caption" color="text.secondary">
            NFC Enterprise Core
          </Typography>
        </Box>
      </Box>
      <Divider />

      <Box sx={{ px: 2, py: 1.5 }}>
        <Chip
          label={isSuperAdmin ? "SUPER ADMIN" : "BUSINESS OWNER"}
          size="small"
          color={isSuperAdmin ? "primary" : "secondary"}
          sx={{ width: '100%', fontWeight: 700, fontSize: '0.7rem' }}
        />
      </Box>

      <List sx={{ px: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={selected}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: '#ffffff',
                    '& .MuiListItemIcon-root': { color: '#ffffff' },
                    '&:hover': { backgroundColor: 'primary.light' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: selected ? '#ffffff' : 'text.secondary' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: selected ? 600 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontSize: '0.9rem' }}>
            {user?.username ? user.username[0].toUpperCase() : 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true }}>
              {user?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ noWrap: true, display: 'block' }}>
              {user?.email || 'Logged in'}
            </Typography>
          </Box>
        </Box>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ borderColor: 'divider' }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: '#ffffff',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {isSuperAdmin ? 'Platform Management Console' : 'Business Management Portal'}
          </Typography>
          <Button
            variant="text"
            color="secondary"
            size="small"
            component={RouterLink}
            to="/"
            target="_blank"
          >
            View Public Site
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid #e2e8f0' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
