import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, Divider, Stack, Chip, CircularProgress
} from '@mui/material';
import ContactlessIcon from '@mui/icons-material/Contactless';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StoreIcon from '@mui/icons-material/Store';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const user = await login(username, password);
      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.non_field_errors?.[0] || 'Invalid credentials. Please check username and password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
    login(demoUser, demoPass).then((user) => {
      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }).catch((err) => {
      setError('Demo login failed. Make sure database is seeded.');
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%', p: { xs: 2, sm: 3 } }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                backgroundColor: 'primary.main',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <ContactlessIcon fontSize="medium" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Sign In to Dynamic QR
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter credentials to access your console
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              color="primary"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={16} />}
              sx={{ mt: 2.5, mb: 2, py: 1.2 }}
            >
              Sign In
            </Button>
          </form>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">
              QUICK DEMO ACCOUNTS
            </Typography>
          </Divider>

          <Stack spacing={1.5}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<AdminPanelSettingsIcon />}
              onClick={() => handleQuickDemoLogin('admin', 'admin123')}
              sx={{ justifyContent: 'flex-start', py: 1 }}
            >
              <Box sx={{ textAlign: 'left', flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Log in as Super Admin</Typography>
                <Typography variant="caption" color="text.secondary">admin / admin123 (Full control)</Typography>
              </Box>
            </Button>

            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<StoreIcon />}
              onClick={() => handleQuickDemoLogin('restaurant_owner', 'owner123')}
              sx={{ justifyContent: 'flex-start', py: 1 }}
            >
              <Box sx={{ textAlign: 'left', flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Log in as Business Owner</Typography>
                <Typography variant="caption" color="text.secondary">restaurant_owner / owner123 (ABC Restaurant)</Typography>
              </Box>
            </Button>
          </Stack>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button component={RouterLink} to="/" size="small" color="inherit">
              ← Back to Homepage
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
