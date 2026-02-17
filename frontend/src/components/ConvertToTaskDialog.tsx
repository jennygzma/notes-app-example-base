import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { TranslateResponse } from '../types';

interface ConvertToTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (task: {
    title: string;
    body: string;
    date: string;
    time?: string;
    view_type: 'weekly' | 'monthly';
  }) => Promise<void>;
  suggestions: TranslateResponse | null;
  loading: boolean;
}

const ConvertToTaskDialog: React.FC<ConvertToTaskDialogProps> = ({
  open,
  onClose,
  onConfirm,
  suggestions,
  loading,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [viewType, setViewType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  useEffect(() => {
    if (suggestions && suggestions.suggestions.length > 0) {
      const suggestion = suggestions.suggestions[selectedSuggestionIndex];
      setTitle(suggestion.title);
      setBody(suggestion.body);
      setDate(suggestion.date);
      setTime(suggestion.time || '');
      // Map old view types to new ones
      const mappedViewType = suggestion.view_type === 'daily' || suggestion.view_type === 'yearly' 
        ? 'weekly' 
        : suggestion.view_type;
      setViewType(mappedViewType as 'weekly' | 'monthly');
    }
  }, [suggestions, selectedSuggestionIndex]);

  const handleConfirm = async () => {
    await onConfirm({
      title,
      body,
      date,
      time: time || undefined,
      view_type: viewType,
    });
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Analyzing note with GPT-5...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (!suggestions || suggestions.suggestions.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>No Suggestions</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Unable to generate task suggestions from this note.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Convert Note to Task</DialogTitle>
      <DialogContent>
        {suggestions.suggestions.length > 1 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              GPT-5 suggested {suggestions.suggestions.length} tasks. Select one:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {suggestions.suggestions.map((_, index) => (
                <Button
                  key={index}
                  variant={selectedSuggestionIndex === index ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setSelectedSuggestionIndex(index)}
                >
                  Suggestion {index + 1}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          
          <TextField
            label="Date"
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
          
          <TextField
            label="Time (optional)"
            type="time"
            fullWidth
            value={time}
            onChange={(e) => setTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            label="View Type"
            select
            fullWidth
            value={viewType}
            onChange={(e) => setViewType(e.target.value as 'weekly' | 'monthly')}
          >
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!title || !date}>
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConvertToTaskDialog;
