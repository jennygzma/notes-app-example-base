import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import Dialog from '../../components/shared/Dialog';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import { notesApi } from '../../services/api';
import { Note } from '../../types';
import { API_BASE_URL } from '../../config';

interface SendEmailDialogProps {
  open: boolean;
  note: Note | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
  open,
  note,
  onClose,
  onSuccess,
}) => {
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      checkGmailStatus();
      if (note) {
        setSubject(note.title);
      }
      setRecipient('');
      setError(null);
      setSuccess(false);
    }
  }, [open, note]);

  const checkGmailStatus = async () => {
    try {
      const status = await notesApi.getGmailStatus();
      setGmailConnected(status.connected);
    } catch (err) {
      setGmailConnected(false);
    }
  };

  const handleConnectGmail = () => {
    const oauthUrl = `${API_BASE_URL}/api/google/auth/start`;
    window.location.href = oauthUrl;
  };

  const handleSend = async () => {
    if (!note || !recipient.trim()) {
      setError('Please enter a recipient email');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await notesApi.sendEmail(note.id, {
        recipient: recipient.trim(),
        subject: subject.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Gmail not connected. Please connect your Gmail account.');
        setGmailConnected(false);
      } else {
        setError(err.message || 'Failed to send email');
      }
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Send as Email"
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ p: 2 }}>
        {gmailConnected === null ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : !gmailConnected ? (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Gmail is not connected. Please connect your Gmail account to send emails.
            </Alert>
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              onClick={handleConnectGmail}
              fullWidth
            >
              Connect Gmail
            </Button>
          </Box>
        ) : (
          <Box>
            <TextField
              label="Recipient Email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="email@example.com"
              sx={{ mb: 2 }}
              disabled={sending}
              autoFocus
            />
            <TextField
              label="Subject (Optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={note?.title || 'Email subject'}
              sx={{ mb: 2 }}
              disabled={sending}
            />
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Email sent successfully!
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button onClick={handleClose} disabled={sending}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                variant="contained"
                startIcon={sending ? <CircularProgress size={20} /> : <EmailIcon />}
                disabled={sending || !recipient.trim()}
              >
                {sending ? 'Sending...' : 'Send Email'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};