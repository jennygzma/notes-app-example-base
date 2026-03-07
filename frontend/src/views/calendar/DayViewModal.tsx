import React from 'react';
import { Box, Typography, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import Dialog from '../../components/shared/Dialog';
import { DayActivities, Task, Note } from '../../types';
import TaskItem from './TaskItem';

interface DayViewModalProps {
  open: boolean;
  onClose: () => void;
  date: string | null;
  activities: DayActivities | null;
  tasks: Task[];
  taskLinkedNotes: { [taskId: string]: Note[] };
  onOpenNote: (noteId: string) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
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

  const formatDateLocal = (value: Date): string => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  const getActivityForDate = (note: Note, type: 'created' | 'updated' | 'moved' | 'email_sent') => {
    const activitiesForType = note.activity_history?.filter(a => a.type === type) || [];
    const matching = activitiesForType.filter(a => formatDateLocal(new Date(a.timestamp)) === date);
    return matching[matching.length - 1];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const sortByTime = (items: Note[], type: 'created' | 'updated' | 'moved' | 'email_sent') => {
    return [...items].sort((a, b) => {
      const timeA = getActivityForDate(a, type)?.timestamp || a.created_at;
      const timeB = getActivityForDate(b, type)?.timestamp || b.created_at;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
  };

  const createdNotes = sortByTime(activities.created, 'created');
  const updatedNotes = sortByTime(activities.updated, 'updated');
  const movedNotes = sortByTime(activities.moved, 'moved');
  const emailSentNotes = sortByTime(activities.email_sent, 'email_sent');

  const hasActivities =
    createdNotes.length > 0 ||
    updatedNotes.length > 0 ||
    movedNotes.length > 0 ||
    emailSentNotes.length > 0;
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
                    const activity = getActivityForDate(note, 'created');
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
                    const activity = getActivityForDate(note, 'updated');
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
                    const activity = getActivityForDate(note, 'moved');
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

              {emailSentNotes.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
                    <Typography variant="subtitle2" color="secondary.main" gutterBottom>
                      Email Sent ({emailSentNotes.length})
                    </Typography>
                  </Box>
                  {emailSentNotes.map(note => {
                    const activity = getActivityForDate(note, 'email_sent');
                    const recipient = activity?.details?.recipient;
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
                        {recipient && (
                          <Typography variant="caption" color="text.secondary">
                            {recipient}
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
