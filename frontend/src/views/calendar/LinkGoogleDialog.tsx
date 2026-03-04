import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Button from '../../components/design-system/Button';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { API_BASE_URL } from '../../config';

interface Props {
  open: boolean;
  onClose: () => void;
}

const LinkGoogleDialog: React.FC<Props> = ({ open, onClose }) => {
  const handleLinkAccount = () => {
    const baseUrl = API_BASE_URL?.replace(/\/$/, '') || '';
    window.location.href = `${baseUrl}/api/google/auth/start`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Connect Google Account</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            Connect your Google account to sync tasks with Google Tasks.
          </Typography>
        </Box>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          What you'll get:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Bidirectional sync between local tasks and Google Tasks" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Automatic conflict detection and resolution" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Keep your tasks in sync across all devices" />
          </ListItem>
        </List>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Note:</strong> You'll be redirected to Google to authorize access. After authorization, 
            you'll be brought back to this application.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
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
      </DialogActions>
    </Dialog>
  );
};

export default LinkGoogleDialog;
