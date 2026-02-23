import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Divider,
  Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Note, PlannerItem, DayActivities } from '../../types';

interface DayViewModalProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  activities: DayActivities | null;
  tasks: PlannerItem[];
  onNoteClick: (noteId: string) => void;
  onTaskToggle: (taskId: string) => void;
}

const DayViewModal: React.FC<DayViewModalProps> = ({
  open,
  onClose,
  date,
  activities,
  tasks,
  onNoteClick,
  onTaskToggle,
}) => {
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const sortByTimestamp = (notes: Note[]) => {
    return [...notes].sort((a, b) => {
      const timeA = a.activity_history?.[a.activity_history.length - 1]?.timestamp || a.updated_at;
      const timeB = b.activity_history?.[b.activity_history.length - 1]?.timestamp || b.updated_at;
      return timeA.localeCompare(timeB);
    });
  };

  const renderNoteSection = (title: string, notes: Note[], count: number) => {
    if (count === 0) return null;

    const sortedNotes = sortByTimestamp(notes);

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          {title} ({count})
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedNotes.map((note) => {
            const activity = note.activity_history?.[note.activity_history.length - 1];
            const timestamp = activity?.timestamp || note.updated_at;
            
            return (
              <Box
                key={note.id}
                onClick={() => onNoteClick(note.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Typography sx={{ flex: 1 }}>
                  • {note.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  → {formatTime(timestamp)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderMovedSection = () => {
    if (!activities?.moved || activities.moved.length === 0) return null;

    const sortedNotes = sortByTimestamp(activities.moved);

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          Moved ({activities.moved.length})
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedNotes.map((note) => {
            const activity = note.activity_history?.[note.activity_history.length - 1];
            const timestamp = activity?.timestamp || note.updated_at;
            const details = activity?.details || {};
            
            return (
              <Box key={note.id}>
                <Box
                  onClick={() => onNoteClick(note.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Typography sx={{ flex: 1 }}>
                    • {note.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    → {formatTime(timestamp)}
                  </Typography>
                </Box>
                {details.from_folder && details.to_folder && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                    {details.from_folder} → {details.to_folder}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const hasNoteActivities = activities && (
    (activities.created?.length || 0) + 
    (activities.updated?.length || 0) + 
    (activities.moved?.length || 0)
  ) > 0;

  const hasTasks = tasks.length > 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          Day View - {formatDate(date)}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Notes Activity Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            📝 Notes Activity
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {hasNoteActivities ? (
            <>
              {renderNoteSection('Created', activities?.created || [], activities?.created?.length || 0)}
              {renderNoteSection('Updated', activities?.updated || [], activities?.updated?.length || 0)}
              {renderMovedSection()}
            </>
          ) : (
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              No note activity on this day
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Tasks Section */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            ✓ Tasks ({tasks.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {hasTasks ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {tasks.map((task) => (
                <Box
                  key={task.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                  }}
                >
                  <Checkbox
                    checked={task.status === 'completed'}
                    onChange={() => onTaskToggle(task.id)}
                    size="small"
                  />
                  <Typography
                    sx={{
                      flex: 1,
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                      color: task.status === 'completed' ? 'text.disabled' : 'text.primary',
                    }}
                  >
                    {task.title}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">
              No tasks on this day
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DayViewModal;