import React from 'react';
import { Box, Typography } from '@mui/material';
import Button from '../../components/design-system/Button';
import Dialog from '../../components/shared/Dialog';
import LinkIcon from '@mui/icons-material/Link';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

interface LinkGoogleDialogProps {
  open: boolean;
  onClose: () => void;
}

const LinkGoogleDialog: React.FC<LinkGoogleDialogProps> = ({ open, onClose }) => {
  const handleLinkAccount = () => {
    window.location.href = `${API_BASE_URL}/api/google/auth/start/`;
  };

  return (
    <Dialog open={open} onClose={onClose} title="Connect Google Account" maxWidth="sm">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="body1">
          Connect your Google account to sync tasks between your notes app and Google Tasks.
        </Typography>

        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            What happens next:
          </Typography>
          <Typography variant="body2" component="div">
            <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
              <li>You'll be redirected to Google's login page</li>
              <li>Grant permission to access your Google Tasks</li>
              <li>You'll be redirected back to complete the setup</li>
            </ol>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleLinkAccount}
            variant="contained"
            startIcon={<LinkIcon />}
          >
            Link Google Account
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default LinkGoogleDialog;