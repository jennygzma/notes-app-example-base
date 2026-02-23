import React from 'react';
import { Box, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';
import Dialog from '../../components/shared/Dialog';
import { DayActivities, PlannerItem, Note } from '../../types';
import TaskItem from './TaskItem';

interface DayViewModalProps {
  open: boolean;
  onClose: () => void;
  date: string;
  activities: DayActivities | null;
  tasks: PlannerItem[];
  taskLinkedNotes: { [taskId: string]: Note[] };
  onNoteClick: (noteId: string) => void;
  onTaskToggleComplete: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskEdit: (task: PlannerItem) => void;
}

const DayViewModal: React.FC<DayViewModalProps> = ({
  open,
  onClose,
  date,
  activities,
  tasks,
  taskLinkedNotes,
  onNoteClick,
  onTaskToggleComplete,
  onTaskDelete,
  onTaskEdit,
}) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const sortByTimestamp = (items: any[]) => {
    return [...items].sort((a, b) => {
      const timeA = a.activity_history?.find((act: any) => 
        new Date(act.timestamp).toISOString().split('T')[0] === date
      )?.timestamp || a.created_at;
      const timeB = b.activity_history?.find((act: any) => 
        new Date(act.timestamp).toISOString().split('T')[0] === date
      )?.timestamp || b.created_at;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
  };

  const hasActivities = activities && (
    activities.created.length > 0 ||
    activities.updated.length > 0 ||
    activities.moved.length > 0
  );

  const hasTasks = tasks.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Day View - ${formatDate(date)}`}
      maxWidth="md"
      fullWidth
    >
      <Box sx={{ p: 3 }}>
        {!hasActivities && !hasTasks && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No activities or tasks for this day
          </Typography>
        )}

        {hasActivities && (
          <>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              📝 Notes Activity
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {activities.created.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Created ({activities.created.length})
                </Typography>
                <List>
                  {sortByTimestamp(activities.created).map((note) => {
                    const activityTime = note.activity_history?.find(
                      (act: any) => act.type === 'created'
                    )?.timestamp;
                    return (
                      <ListItem
                        key={note.id}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderRadius: 1,
                        }}
                        onClick={() => onNoteClick(note.id)}
                      >
                        <ListItemText
                          primary={`• ${note.title}`}
                          secondary={activityTime ? formatTime(activityTime) : ''}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}

            {activities.updated.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Updated ({activities.updated.length})
                </Typography>
                <List>
                  {sortByTimestamp(activities.updated).map((note) => {
                    const activityTime = note.activity_history?.findLast(
                      (act: any) => act.type === 'updated' && 
                      new Date(act.timestamp).toISOString().split('T')[0] === date
                    )?.timestamp;
                    return (
                      <ListItem
                        key={note.id}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderRadius: 1,
                        }}
                        onClick={() => onNoteClick(note.id)}
                      >
                        <ListItemText
                          primary={`• ${note.title}`}
                          secondary={activityTime ? formatTime(activityTime) : ''}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}

            {activities.moved.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Moved ({activities.moved.length})
                </Typography>
                <List>
                  {sortByTimestamp(activities.moved).map((note) => {
                    const moveActivity = note.activity_history?.findLast(
                      (act: any) => act.type === 'moved' && 
                      new Date(act.timestamp).toISOString().split('T')[0] === date
                    );
                    return (
                      <ListItem
                        key={note.id}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderRadius: 1,
                        }}
                        onClick={() => onNoteClick(note.id)}
                      >
                        <ListItemText
                          primary={`• ${note.title}`}
                          secondary={
                            moveActivity ? 
                            `${formatTime(moveActivity.timestamp)} - ${moveActivity.details?.from_folder || 'Unorganized'} → ${moveActivity.details?.to_folder || 'Unorganized'}` : 
                            ''
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}

            {hasTasks && <Divider sx={{ my: 3 }} />}
          </>
        )}

        {hasTasks && (
          <>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              ✓ Tasks ({tasks.length})
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={onTaskToggleComplete}
                  onDelete={onTaskDelete}
                  onEdit={onTaskEdit}
                  linkedNotes={taskLinkedNotes[task.id] || []}
                  onNoteClick={onNoteClick}
                />
              ))}
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default DayViewModal;