import React, { useState, useEffect } from 'react';
import {
  Box,
} from '@mui/material';
import { CreateTaskRequest, Task } from '../../types';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import Dialog from '../../components/shared/Dialog';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: CreateTaskRequest) => Promise<void>;
  editTask?: Task | null;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onSave,
  editTask,
}) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const formatDateLocal = (value: Date): string => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDueDate(editTask.due_date || '');
    } else {
      setTitle('');
      setDueDate(formatDateLocal(new Date()));
    }
  }, [editTask, open]);

  const handleSave = async () => {
    const task: CreateTaskRequest = {
      title,
      due_date: dueDate || undefined,
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
          <Button onClick={handleSave} variant="contained" disabled={!title || !dueDate}>
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
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
        />
      </Box>
    </Dialog>
  );
};

export default CreateTaskDialog;
