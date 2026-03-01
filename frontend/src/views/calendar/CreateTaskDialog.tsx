import React, { useState, useEffect } from 'react';
import {
  MenuItem,
  Box,
} from '@mui/material';
import { CreatePlannerItemRequest, PlannerItem } from '../../types';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import Dialog from '../../components/shared/Dialog';

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

  const formatDateLocal = (value: Date): string => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setBody(editTask.body);
      setDate(editTask.date);
      setTime(editTask.time || '');
      const mappedViewType = editTask.view_type === 'daily' || editTask.view_type === 'yearly' 
        ? 'weekly' 
        : editTask.view_type;
      setViewType(mappedViewType as 'weekly' | 'monthly');
    } else {
      setTitle('');
      setBody('');
      setDate(formatDateLocal(new Date()));
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
    <Dialog
      open={open}
      onClose={onClose}
      title={editTask ? 'Edit Task' : 'Create Task'}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!title || !date}>
            {editTask ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        
        <TextField
          label="Description"
          multiline
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
        />
        
        <TextField
          label="Time (optional)"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        
        <TextField
          label="View Type"
          select
          value={viewType}
          onChange={(e) => setViewType(e.target.value as 'weekly' | 'monthly')}
        >
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </TextField>
      </Box>
    </Dialog>
  );
};

export default CreateTaskDialog;
