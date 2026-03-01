import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Checkbox,
  IconButton,
  Stack,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Task, Note } from '../../types';
import Tag from '../../components/design-system/Tag';
import InlineConfirmButton from '../../components/shared/InlineConfirmButton';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  linkedNotes?: Note[];
  onNoteClick?: (noteId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
  linkedNotes = [],
  onNoteClick,
}) => {
  const isCompleted = task.completed;

  return (
    <Card 
      sx={{ 
        mb: 1,
        opacity: isCompleted ? 0.7 : 1,
        '&:hover': {
          boxShadow: 2,
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Checkbox
            checked={isCompleted}
            onChange={() => onToggleComplete(task.id)}
            sx={{ mt: -1 }}
          />
          
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                textDecoration: isCompleted ? 'line-through' : 'none',
                fontWeight: 600,
              }}
            >
              {task.title}
            </Typography>
            
            {task.due_date && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Due: {task.due_date}
              </Typography>
            )}
            
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
              {task.google_task_id && (
                <Tag label="Synced" color="primary" variant="outlined" />
              )}
              
              {linkedNotes.map((note) => (
                <Tag
                  key={note.id}
                  label={note.title}
                  onClick={() => onNoteClick?.(note.id)}
                />
              ))}
            </Stack>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={() => onEdit(task)}>
              <EditIcon fontSize="small" />
            </IconButton>
            
            <InlineConfirmButton 
              onConfirm={() => onDelete(task.id)}
              confirmText=""
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaskItem;
