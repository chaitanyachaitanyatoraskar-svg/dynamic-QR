import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, Divider, Stack, CircularProgress
} from '@mui/material';
import ContactlessIcon from '@mui/icons-material/Contactless';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await authService.getSetupStatus();
        if (res.data.needs_setup) {
          setIsSetupMode(true);
        }
      } catch (err) {
        console.error("Setup check error", err);
      } finally {
        setCheckingSetup(false);
      }
    };
    checkSetup();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
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
      setError(err.response?.data?.non_field_errors?.[0] || 'Invalid credentials. Please verify your username and password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitialSetup = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await authService.setupAdmin({ username, password, email });
      localStorage.setItem('auth_token', res.data.token);
      setSuccessMsg('Administrator account created! Logging in...');
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 800);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Setup failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (checkingSetup) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
        <CircularProgress size={32} />
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
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {isSetupMode ? 'Initial Platform Setup' : 'Platform Sign In'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSetupMode
                ? 'Create your Master Administrator credentials to get started'
                : 'Enter credentials to access your console'}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
          {successMsg && <Alert severity="success" sx={{ mb: 2.5 }}>{successMsg}</Alert>}

          {isSetupMode ? (
            /* SECURE INITIAL SETUP FORM */
            <form onSubmit={handleInitialSetup}>
              <Alert severity="info" sx={{ mb: 2.5 }}>
                No administrator account exists yet. Create your permanent master administrator account now.
              </Alert>
              <TextField
                fullWidth
                label="Admin Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                autoFocus
              />
              <TextField
                fullWidth
                label="Admin Email"
                type="email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Secure Password"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                helperText="Minimum 6 characters"
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                color="primary"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} /> : <AdminPanelSettingsIcon />}
                sx={{ mt: 2.5, mb: 2, py: 1.2, fontWeight: 700 }}
              >
                {submitting ? 'Setting up...' : 'Create Master Administrator'}
              </Button>
            </form>
          ) : (
            /* STANDARD SECURE LOGIN FORM */
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
                sx={{ mt: 2.5, mb: 2, py: 1.2, fontWeight: 700 }}
              >
                Sign In
              </Button>
            </form>
          )}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button component={RouterLink} to="/" size="small" color="inherit">
              ← Return to Home
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
