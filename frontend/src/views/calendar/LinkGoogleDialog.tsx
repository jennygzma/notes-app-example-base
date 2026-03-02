import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import Button from '../../components/design-system/Button';
import { API_BASE_URL } from '../../config';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const LinkGoogleDialog: React.FC<Props> = ({ open, onClose }) => {
  const handleLinkGoogle = () => {
    const oauthUrl = `${API_BASE_URL || 'http://localhost:8001'}/api/google/auth/start/`;
    window.location.href = oauthUrl;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Connect Google Account</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" gutterBottom>
            To sync tasks with Google Tasks, you need to connect your Google account.
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              You will be redirected to Google to authorize access to your tasks. 
              After authorization, you'll be redirected back to this app.
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary">
            Once connected, you can:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Sync tasks between this app and Google Tasks
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              View and resolve conflicts when tasks are modified in both places
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Keep your tasks up to date across all your devices
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleLinkGoogle} variant="contained">
          Link Google Account
        </Button>
      </DialogActions>
    </Dialog>
  );
};