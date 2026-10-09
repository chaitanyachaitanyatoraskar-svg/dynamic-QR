import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, Stack, CircularProgress, IconButton, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, FormHelperText, Link
} from '@mui/material';
import ContactlessIcon from '@mui/icons-material/Contactless';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
import HelpIcon from '@mui/icons-material/Help';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const DEFAULT_QUESTIONS = [
  "What was the name of your first school?",
  "What is your favorite city?",
  "What was your childhood nickname?",
  "What was the make of your first car?",
  "What is your mother's birthplace?",
];

export const LoginPage = () => {
  // Modes: 'login' | 'forgot_identify' | 'forgot_answer' | 'setup'
  const [mode, setMode] = useState('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [forgotUsername, setForgotUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Initial Setup state
  const [setupUsername, setSetupUsername] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupQuestion, setSetupQuestion] = useState(DEFAULT_QUESTIONS[0]);
  const [setupAnswer, setSetupAnswer] = useState('');

  // Status & feedback state
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await authService.getSetupStatus();
        if (res.data.needs_setup) {
          setMode('setup');
        }
      } catch (err) {
        console.error("Setup check error", err);
      } finally {
        setCheckingSetup(false);
      }
    };
    checkSetup();
  }, []);

  // Clear messages when mode changes
  const switchMode = (newMode) => {
    setError('');
    setSuccessMsg('');
    setMode(newMode);
  };

  // 1. Standard Sign In Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const user = await login(username.trim(), password);
      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || 'Invalid credentials. Please verify your username and password.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Forgot Password - Step 1: Find Account & Retrieve Security Question
  const handleIdentifyAccount = async (e) => {
    e.preventDefault();
    if (!forgotUsername.trim()) {
      setError('Please enter your username or email address.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await authService.getSecurityQuestion(forgotUsername.trim());
      setSecurityQuestion(res.data.question || res.data.security_question);
      setSecurityAnswer('');
      setNewPassword('');
      setConfirmPassword('');
      switchMode('forgot_answer');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Unable to retrieve security question for this account.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Forgot Password - Step 2: Verify Security Answer & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!securityAnswer.trim()) {
      setError('Please enter the answer to your security question.');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await authService.resetPasswordWithQuestion({
        username: forgotUsername.trim(),
        answer: securityAnswer.trim(),
        new_password: newPassword,
      });

      setSuccessMsg('Password reset successful! Logging you in...');
      if (res.data?.token && res.data?.user) {
        loginWithToken(res.data.token, res.data.user);
        setTimeout(() => {
          if (res.data.user.role === 'SUPER_ADMIN') {
            navigate('/admin/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      } else {
        setTimeout(() => {
          switchMode('login');
          setUsername(forgotUsername.trim());
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to reset password. Please check your security answer.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Initial Platform Super-Admin Setup
  const handleInitialSetup = async (e) => {
    e.preventDefault();
    if (!setupUsername.trim() || !setupPassword) {
      setError('Username and password are required.');
      return;
    }
    if (setupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!setupAnswer.trim()) {
      setError('Please provide an answer to your recovery security question.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await authService.setupAdmin({
        username: setupUsername.trim(),
        password: setupPassword,
        email: setupEmail.trim(),
        security_question: setupQuestion,
        security_answer: setupAnswer.trim(),
      });
      localStorage.setItem('auth_token', res.data.token);
      setSuccessMsg('Master Administrator created successfully! Redirecting...');
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Setup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSetup) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
        <CircularProgress size={36} />
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
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(at 50% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.1) 0px, transparent 50%)',
        p: 2,
      }}
    >
      <Card
        elevation={10}
        sx={{
          maxWidth: 460,
          width: '100%',
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 4,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          backgroundColor: '#ffffff'
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Header Icon & Title */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 3,
                backgroundColor: mode.startsWith('forgot') ? '#f59e0b' : 'primary.main',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
                boxShadow: mode.startsWith('forgot')
                  ? '0 10px 15px -3px rgba(245, 158, 11, 0.3)'
                  : '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
              }}
            >
              {mode === 'setup' && <AdminPanelSettingsIcon fontSize="medium" />}
              {mode === 'login' && <ContactlessIcon fontSize="medium" />}
              {mode.startsWith('forgot') && <LockResetIcon fontSize="medium" />}
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
              {mode === 'setup' && 'Initial Master Setup'}
              {mode === 'login' && 'Platform Sign In'}
              {mode === 'forgot_identify' && 'Account Recovery'}
              {mode === 'forgot_answer' && 'Security Verification'}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {mode === 'setup' && 'Create your Master Administrator credentials & recovery key'}
              {mode === 'login' && 'Enter your credentials to access the console'}
              {mode === 'forgot_identify' && 'Enter your username or email to find your security question'}
              {mode === 'forgot_answer' && 'Answer your security question to set a new password'}
            </Typography>
          </Box>

          {/* Alert Messages */}
          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}
          {successMsg && (
            <Alert
              severity="success"
              icon={<CheckCircleIcon />}
              sx={{ mb: 2.5, borderRadius: 2 }}
            >
              {successMsg}
            </Alert>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                id="login-username"
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                autoFocus
                placeholder="e.g. chaitanya"
              />

              <TextField
                fullWidth
                id="login-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 1 }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {
                    setForgotUsername(username);
                    switchMode('forgot_identify');
                  }}
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                color="primary"
                disabled={submitting}
                startIcon={submitting && <CircularProgress size={18} color="inherit" />}
                sx={{ mt: 2, mb: 2, py: 1.3, fontWeight: 700, borderRadius: 2 }}
              >
                {submitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD - STEP 1 IDENTIFY ACCOUNT */}
          {mode === 'forgot_identify' && (
            <form onSubmit={handleIdentifyAccount}>
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="body2" color="text.secondary">
                  Password recovery is protected by your configured security question. Enter your username below to proceed.
                </Typography>
              </Box>

              <TextField
                fullWidth
                id="forgot-username"
                label="Username or Email"
                variant="outlined"
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                margin="normal"
                required
                autoFocus
                placeholder="e.g. chaitanya"
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                color="primary"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <HelpIcon />}
                sx={{ mt: 2.5, mb: 2, py: 1.3, fontWeight: 700, borderRadius: 2 }}
              >
                {submitting ? 'Searching...' : 'Continue to Security Question'}
              </Button>

              <Button
                fullWidth
                type="button"
                variant="text"
                color="inherit"
                startIcon={<ArrowBackIcon />}
                onClick={() => switchMode('login')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Back to Sign In
              </Button>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD - STEP 2 ANSWER QUESTION & RESET */}
          {mode === 'forgot_answer' && (
            <form onSubmit={handleResetPassword}>
              <Box sx={{ mb: 2.5, p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Security Question for {forgotUsername}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a8a', mt: 0.5 }}>
                  {securityQuestion}
                </Typography>
              </Box>

              <TextField
                fullWidth
                id="recovery-answer"
                label="Your Security Answer"
                variant="outlined"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                margin="normal"
                required
                autoFocus
                placeholder="Answer is case-insensitive"
                helperText="Type the exact answer you provided during setup"
              />

              <TextField
                fullWidth
                id="recovery-new-password"
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                variant="outlined"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                required
                helperText="Minimum 6 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle new password visibility"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                        size="small"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                id="recovery-confirm-password"
                label="Confirm New Password"
                type={showNewPassword ? 'text' : 'password'}
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LockResetIcon />}
                sx={{ mt: 2.5, mb: 1.5, py: 1.3, fontWeight: 700, borderRadius: 2 }}
              >
                {submitting ? 'Resetting Password...' : 'Reset Password & Sign In'}
              </Button>

              <Button
                fullWidth
                type="button"
                variant="text"
                color="inherit"
                startIcon={<ArrowBackIcon />}
                onClick={() => switchMode('forgot_identify')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Change Username
              </Button>
            </form>
          )}

          {/* MODE: INITIAL SYSTEM SETUP */}
          {mode === 'setup' && (
            <form onSubmit={handleInitialSetup}>
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                No administrator account exists yet. Create your permanent master administrator account and configure your recovery question.
              </Alert>

              <TextField
                fullWidth
                id="setup-username"
                label="Admin Username"
                variant="outlined"
                value={setupUsername}
                onChange={(e) => setSetupUsername(e.target.value)}
                margin="normal"
                required
                autoFocus
              />

              <TextField
                fullWidth
                id="setup-email"
                label="Admin Email"
                type="email"
                variant="outlined"
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
                margin="normal"
              />

              <TextField
                fullWidth
                id="setup-password"
                label="Secure Password"
                type="password"
                variant="outlined"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                margin="normal"
                required
                helperText="Minimum 6 characters"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel id="setup-question-label">Recovery Security Question</InputLabel>
                <Select
                  labelId="setup-question-label"
                  id="setup-question"
                  value={setupQuestion}
                  label="Recovery Security Question"
                  onChange={(e) => setSetupQuestion(e.target.value)}
                >
                  {DEFAULT_QUESTIONS.map((q) => (
                    <MenuItem key={q} value={q}>{q}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>Used to safely recover your account if you forget your password</FormHelperText>
              </FormControl>

              <TextField
                fullWidth
                id="setup-answer"
                label="Security Question Answer"
                variant="outlined"
                value={setupAnswer}
                onChange={(e) => setSetupAnswer(e.target.value)}
                margin="normal"
                required
                helperText="Answers are case-insensitive and encrypted securely"
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                color="primary"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AdminPanelSettingsIcon />}
                sx={{ mt: 2.5, mb: 2, py: 1.3, fontWeight: 700, borderRadius: 2 }}
              >
                {submitting ? 'Setting up...' : 'Create Master Administrator'}
              </Button>
            </form>
          )}

          {/* Return to Home Navigation */}
          <Box sx={{ textAlign: 'center', mt: 2.5, pt: 2, borderTop: '1px solid #f1f5f9' }}>
            <Button component={RouterLink} to="/" size="small" color="inherit" sx={{ textTransform: 'none', color: 'text.secondary' }}>
              ← Return to Platform Home
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
