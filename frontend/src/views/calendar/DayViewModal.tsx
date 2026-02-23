import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import Dialog from '../../components/shared/Dialog';
import { DayActivities, PlannerItem, Note } from '../../types';
import NoteIcon from '@mui/icons-material/Description';
import TaskIcon from '@mui/icons-material/CheckCircleOutline';
import CreateIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import MoveIcon from '@mui/icons-material/DriveFileMove';
import TaskItem from './TaskItem';

interface DayViewModalProps {
  open: boolean;
  onClose: () => void;
  date: string;
  tasks: PlannerItem[];
  activities?: DayActivities;
  onNavigateToNote?: (noteId: string) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: PlannerItem) => void;
  taskLinkedNotes: { [taskId: string]: Note[] };
}

const DayViewModal: React.FC<DayViewModalProps> = ({
  open,
  onClose,
  date,
  tasks,
  activities,
  onNavigateToNote,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  taskLinkedNotes,
}) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const hasContent = tasks.length > 0 || 
    (activities && (activities.created.length > 0 || activities.updated.length > 0 || activities.moved.length > 0));

  return (
    <Dialog open={open} onClose={onClose} title={`Day View - ${formatDate(date)}`} maxWidth="md">
      <Box sx={{ minHeight: 300, maxHeight: '70vh', overflow: 'auto' }}>
        {!hasContent ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body1">No activities or tasks for this day</Typography>
          </Box>
        ) : (
          <>
            {activities && (activities.created.length > 0 || activities.updated.length > 0 || activities.moved.length > 0) && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <NoteIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Notes Activity
                  </Typography>
                </Box>

                {activities.created.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CreateIcon sx={{ fontSize: 20, color: 'success.main' }} />
                      <Typography variant="subtitle2" fontWeight={600} color="success.main">
                        Created ({activities.created.length})
                      </Typography>
                    </Box>
                    {activities.created.map((entry, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          py: 1,
                          px: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'grey.100',
                          },
                        }}
                        onClick={() => onNavigateToNote?.(entry.note.id)}
                      >
                        <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                          {entry.note.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(entry.timestamp)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {activities.updated.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EditIcon sx={{ fontSize: 20, color: 'info.main' }} />
                      <Typography variant="subtitle2" fontWeight={600} color="info.main">
                        Updated ({activities.updated.length})
                      </Typography>
                    </Box>
                    {activities.updated.map((entry, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          py: 1,
                          px: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'grey.100',
                          },
                        }}
                        onClick={() => onNavigateToNote?.(entry.note.id)}
                      >
                        <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                          {entry.note.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(entry.timestamp)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {activities.moved.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MoveIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                      <Typography variant="subtitle2" fontWeight={600} color="warning.main">
                        Moved ({activities.moved.length})
                      </Typography>
                    </Box>
                    {activities.moved.map((entry, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          py: 1,
                          px: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'grey.100',
                          },
                        }}
                        onClick={() => onNavigateToNote?.(entry.note.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                            {entry.note.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(entry.timestamp)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {entry.from_folder ? 'From folder' : 'From unorganized'} → {entry.to_folder ? 'To folder' : 'To unorganized'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {activities && (activities.created.length > 0 || activities.updated.length > 0 || activities.moved.length > 0) && tasks.length > 0 && (
              <Divider sx={{ my: 3 }} />
            )}

            {tasks.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TaskIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Tasks ({tasks.length})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {tasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onDelete={onDeleteTask}
                      onEdit={onEditTask}
                      linkedNotes={taskLinkedNotes[task.id] || []}
                      onNoteClick={(noteId) => onNavigateToNote?.(noteId)}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default DayViewModal;