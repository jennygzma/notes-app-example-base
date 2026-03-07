import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import Dialog from '../../components/shared/Dialog';
import { notesApi, gmailApi } from '../../services/api';
import { API_BASE_URL } from '../../config';
import { Note, SendEmailResponse } from '../../types';

interface SendEmailDialogProps {
  open: boolean;
  note: Note;
  onClose: () => void;
  onSuccess: (result: SendEmailResponse, recipient: string, subject: string) => void;
}

export const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
  open,
  note,
  onClose,
  onSuccess,
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState(note.title);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (open) {
      checkGmailStatus();
      setRecipient('');
      setSubject(note.title);
      setError(null);
      setSuccess(null);
    }
  }, [open, note.title]);

  const checkGmailStatus = async () => {
    setCheckingStatus(true);
    try {
      const status = await gmailApi.getStatus();
      setConnected(status.connected);
    } catch (err) {
      setConnected(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleConnectGmail = () => {
    window.location.href = `${API_BASE_URL}/api/google/auth/start`;
  };

  const handleSend = async () => {
    if (!recipient.trim()) {
      setError('Please enter a recipient email');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const trimmedRecipient = recipient.trim();
      const trimmedSubject = subject.trim();
      const resolvedSubject = trimmedSubject || note.title;
      const result = await notesApi.sendAsEmail(note.id, {
        recipient: trimmedRecipient,
        subject: trimmedSubject || undefined,
      });
      onSuccess(result, trimmedRecipient, resolvedSubject);
      setSuccess('Email sent successfully.');
      setRecipient('');
      setSubject(note.title);
    } catch (err: any) {
      const message = err?.error || err?.details || err?.message || 'Failed to send email';
      if (String(message).toLowerCase().includes('gmail not connected')) {
        setConnected(false);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Send Note as Email">
      {checkingStatus ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : !connected ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography>
            Gmail is not connected. Please connect your Gmail account to send emails.
          </Typography>
          <Button onClick={handleConnectGmail} variant="contained" color="secondary">
            Connect Gmail
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Recipient Email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="recipient@example.com"
            disabled={loading}
            autoFocus
          />

          <TextField
            label="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={note.title}
            disabled={loading}
          />

          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={onClose} disabled={loading}>
              {success ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSend}
              variant="contained"
              color="secondary"
              disabled={loading || !recipient.trim() || !!success}
            >
              {loading ? <CircularProgress size={20} /> : 'Send Email'}
            </Button>
          </Box>
        </Box>
      )}
    </Dialog>
  );
};
