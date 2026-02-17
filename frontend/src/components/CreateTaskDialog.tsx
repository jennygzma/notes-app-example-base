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
} from '@mui/material';
import { CreatePlannerItemRequest, PlannerItem } from '../types';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: CreatePlannerItemRequest) => Promise<void>;
  editTask?: PlannerItem | null;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onSave,
  editTask,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [viewType, setViewType] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setBody(editTask.body);
      setDate(editTask.date);
      setTime(editTask.time || '');
      // Map old view types to new ones
      const mappedViewType = editTask.view_type === 'daily' || editTask.view_type === 'yearly' 
        ? 'weekly' 
        : editTask.view_type;
      setViewType(mappedViewType as 'weekly' | 'monthly');
    } else {
      setTitle('');
      setBody('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('');
      setViewType('weekly');
    }
  }, [editTask, open]);

  const handleSave = async () => {
    const task: CreatePlannerItemRequest = {
      title,
      body,
      date,
      time: time || undefined,
      view_type: viewType,
    };
    await onSave(task);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
        <Button onClick={handleSave} variant="contained" disabled={!title || !date}>
          {editTask ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskDialog;
