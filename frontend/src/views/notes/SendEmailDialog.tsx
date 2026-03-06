import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import Dialog from '../../components/shared/Dialog';
import TextField from '../../components/design-system/TextField';
import Button from '../../components/design-system/Button';
import { notesApi } from '../../services/api';

interface SendEmailDialogProps {
  open: boolean;
  noteId: string;
  noteTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
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

  const handleSend = async () => {
    if (!recipient.trim()) {
      setError('Recipient email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await notesApi.sendEmail(noteId, {
        recipient: recipient.trim(),
        subject: subject.trim() || undefined,
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRecipient('');
    setSubject(noteTitle);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Send Note as Email">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 400 }}>
        <TextField
          label="Recipient Email"
          placeholder="recipient@example.com"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          disabled={loading}
          required
        />

        <TextField
          label="Subject"
          placeholder={noteTitle}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={loading}
          helperText="Defaults to note title if empty"
        />

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={loading || !recipient.trim()}>
            {loading ? <CircularProgress size={24} /> : 'Send Email'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};