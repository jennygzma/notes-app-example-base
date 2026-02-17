import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Checkbox,
  IconButton,
  Chip,
  Stack,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { PlannerItem, Note } from '../types';

interface TaskItemProps {
  task: PlannerItem;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: PlannerItem) => void;
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
  const isCompleted = task.status === 'completed';

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
            
            {task.body && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {task.body}
              </Typography>
            )}
            
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
              {task.time && (
                <Chip label={task.time} size="small" />
              )}
              <Chip label={task.view_type} size="small" color="primary" variant="outlined" />
              
              {linkedNotes.map((note) => (
                <Chip
                  key={note.id}
                  label={note.title}
                  size="small"
                  onClick={() => onNoteClick?.(note.id)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Stack>
          </Box>
          
          <Box>
            <IconButton size="small" onClick={() => onEdit(task)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => onDelete(task.id)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaskItem;
