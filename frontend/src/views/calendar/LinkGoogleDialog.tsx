import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import Button from '../../components/design-system/Button';
import GoogleIcon from '@mui/icons-material/Google';
import { API_BASE_URL } from '../../config';

interface Props {
  open: boolean;
  onClose: () => void;
}

const LinkGoogleDialog: React.FC<Props> = ({ open, onClose }) => {
  const handleLink = () => {
    const baseUrl = API_BASE_URL ? API_BASE_URL.replace(/\/$/, '') : 'http://localhost:8001';
    window.location.href = `${baseUrl}/api/google/auth/start`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Connect Google Account</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" gutterBottom>
            To sync your tasks with Google Tasks, you need to connect your Google account.
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            You'll be redirected to Google to authorize access to your tasks. We only request access to your Google Tasks data.
          </Alert>

          <Typography variant="body2" color="text.secondary">
            After authorizing, you'll be redirected back to the app and can start syncing your tasks.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleLink}
          variant="contained"
          color="primary"
          startIcon={<GoogleIcon />}
        >
          Link Google Account
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LinkGoogleDialog;
