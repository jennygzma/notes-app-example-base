import React from 'react';
import { Box, Typography, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '../../components/shared/Dialog';
import { DayActivities, PlannerItem, Note } from '../../types';
import TaskItem from './TaskItem';

interface DayViewModalProps {
  open: boolean;
  onClose: () => void;
  date: string | null;
  activities: DayActivities | null;
  tasks: PlannerItem[];
  taskLinkedNotes: { [taskId: string]: Note[] };
  onOpenNote: (noteId: string) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: PlannerItem) => void;
}

const DayViewModal: React.FC<DayViewModalProps> = ({
  open,
  onClose,
  date,
  activities,
  tasks,
  taskLinkedNotes,
  onOpenNote,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
}) => {
  if (!date || !activities) return null;

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const sortByTime = (items: Note[]) => {
    return [...items].sort((a, b) => {
      const timeA = a.activity_history[a.activity_history.length - 1]?.timestamp || a.created_at;
      const timeB = b.activity_history[b.activity_history.length - 1]?.timestamp || b.created_at;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
  };

  const createdNotes = sortByTime(activities.created);
  const updatedNotes = sortByTime(activities.updated);
  const movedNotes = sortByTime(activities.moved);

  const hasActivities = createdNotes.length > 0 || updatedNotes.length > 0 || movedNotes.length > 0;
  const hasTasks = tasks.length > 0;

  const title = (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Typography variant="h6">
        Day View - {formatDate(date)}
      </Typography>
      <IconButton onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth title={title}>
        <Box sx={{ py: 2 }}>
          {hasActivities && (
            <>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                📝 Notes Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {createdNotes.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Created ({createdNotes.length})
                  </Typography>
                  {createdNotes.map(note => {
                    const activity = note.activity_history.find(a => a.type === 'created');
                    return (
                      <Box
                        key={note.id}
                        onClick={() => onOpenNote(note.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          py: 1,
                          px: 1.5,
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <Typography sx={{ flex: 1 }}>
                          • {note.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity ? formatTime(activity.timestamp) : ''}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {updatedNotes.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Updated ({updatedNotes.length})
                  </Typography>
                  {updatedNotes.map(note => {
                    const activity = note.activity_history.filter(a => a.type === 'updated').pop();
                    return (
                      <Box
                        key={note.id}
                        onClick={() => onOpenNote(note.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          py: 1,
                          px: 1.5,
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <Typography sx={{ flex: 1 }}>
                          • {note.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity ? formatTime(activity.timestamp) : ''}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {movedNotes.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Moved ({movedNotes.length})
                  </Typography>
                  {movedNotes.map(note => {
                    const activity = note.activity_history.filter(a => a.type === 'moved').pop();
                    const fromFolder = activity?.details?.from_folder || '';
                    const toFolder = activity?.details?.to_folder || '';
                    return (
                      <Box key={note.id} sx={{ mb: 1 }}>
                        <Box
                          onClick={() => onOpenNote(note.id)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 1,
                            px: 1.5,
                            cursor: 'pointer',
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <Typography sx={{ flex: 1 }}>
                            • {note.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity ? formatTime(activity.timestamp) : ''}
                          </Typography>
                        </Box>
                        {(fromFolder || toFolder) && (
                          <Typography variant="caption" color="text.secondary" sx={{ pl: 3 }}>
                            {fromFolder || 'Unfiled'} → {toFolder || 'Unfiled'}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />
            </>
          )}

          {hasTasks && (
            <>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                ✓ Tasks ({tasks.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {tasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onDelete={onDeleteTask}
                    onEdit={onEditTask}
                    linkedNotes={taskLinkedNotes[task.id] || []}
                    onNoteClick={onOpenNote}
                  />
                ))}
              </Box>
            </>
          )}

          {!hasActivities && !hasTasks && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No activities or tasks for this day
              </Typography>
            </Box>
          )}
        </Box>
    </Dialog>
  );
};

export default DayViewModal;
