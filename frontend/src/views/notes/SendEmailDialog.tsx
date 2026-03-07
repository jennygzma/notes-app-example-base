import React, { useState } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import Dialog from '../../components/shared/Dialog';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import { notesApi } from '../../services/api';

interface SendEmailDialogProps {
  open: boolean;
  noteId: string;
  noteTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
  open,
  noteId,
  noteTitle,
  onClose,
  onSuccess,
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState(noteTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!recipient.trim()) {
      setError('Recipient email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await notesApi.sendAsEmail(noteId, {
        recipient: recipient.trim(),
        subject: subject.trim() || noteTitle,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send email. Please try again.');
      console.error('Send email error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRecipient('');
    setSubject(noteTitle);
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Send as Email">
      <Box sx={{ minWidth: 400 }}>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Email sent successfully!
          </Alert>
        ) : (
          <>
            <TextField
              label="Recipient Email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="recipient@example.com"
              type="email"
              sx={{ mb: 2 }}
              autoFocus
            />

            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              sx={{ mb: 2 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSend}
                disabled={loading || !recipient.trim()}
                startIcon={loading ? <CircularProgress size={16} /> : <EmailIcon />}
              >
                {loading ? 'Sending...' : 'Send Email'}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default SendEmailDialog;