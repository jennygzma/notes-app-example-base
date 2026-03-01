import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Fab,
  Snackbar,
  Alert,
  Divider,
  useTheme,
} from '@mui/material';
import Button from '../../components/design-system/Button';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import SyncIcon from '@mui/icons-material/Sync';
import MigrateIcon from '@mui/icons-material/CloudUpload';
import CreateTaskDialog from './CreateTaskDialog';
import TaskItem from './TaskItem';
import DayViewModal from './DayViewModal';
import SyncPreviewDialog from './SyncPreviewDialog';
import { Task, CreateTaskRequest, Note, DayActivities, SyncPreviewResponse, SyncResolution } from '../../types';
import { taskApi, notesApi } from '../../services/api';

type ViewType = 'weekly' | 'monthly';

interface PlannerViewProps {
  initialSelectedTaskId?: string | null;
  onNavigateToNote?: (noteId: string) => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ initialSelectedTaskId, onNavigateToNote }) => {
  const theme = useTheme();
  const [viewType, setViewType] = useState<ViewType>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLinkedNotes, setTaskLinkedNotes] = useState<{ [taskId: string]: Note[] }>({});
  const [noteActivities, setNoteActivities] = useState<{ [date: string]: DayActivities }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [dayViewOpen, setDayViewOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncPreview, setSyncPreview] = useState<SyncPreviewResponse | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateLocal = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    loadTasks();
    loadNoteActivities();
    checkGoogleStatus();
  }, [currentDate, viewType]);

  const checkGoogleStatus = async () => {
    try {
      const status = await taskApi.syncStatus();
      setGoogleConnected(status.connected);
    } catch {
      setGoogleConnected(false);
    }
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewType === 'weekly') {
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      end.setDate(end.getDate() + (6 - dayOfWeek));
      return {
        start: formatDateLocal(start),
        end: formatDateLocal(end),
      };
    } else {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      return {
        start: formatDateLocal(start),
        end: formatDateLocal(end),
      };
    }
  };

  const loadTasks = async () => {
    try {
      const tasksData = await taskApi.getAll();
      setTasks(tasksData);
    } catch (error) {
      showSnackbar('Failed to load tasks', 'error');
    }
  };

  const loadNoteActivities = async () => {
    try {
      const { start, end } = getDateRange();
      const [startYear, startMonth, startDay] = start.split('-').map(Number);
      const [endYear, endMonth, endDay] = end.split('-').map(Number);
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      const activitiesMap: Record<string, DayActivities> = {};
      const current = new Date(startDate);
      
      while (current <= endDate) {
        const dateStr = formatDateLocal(current);
        try {
          const activities = await notesApi.getActivityByDate(dateStr);
          activitiesMap[dateStr] = activities;
        } catch {
          activitiesMap[dateStr] = { date: dateStr, created: [], updated: [], moved: [] };
        }
        current.setDate(current.getDate() + 1);
      }
      
      setNoteActivities(activitiesMap);
    } catch (error) {
      console.error('Failed to load note activities', error);
    }
  };

  const handleCreateTask = async (task: CreateTaskRequest) => {
    try {
      if (editTask) {
        await taskApi.update(editTask.id, task);
        showSnackbar('Task updated', 'success');
      } else {
        await taskApi.create(task);
        showSnackbar('Task created', 'success');
      }
      setEditTask(null);
      loadTasks();
    } catch (error) {
      showSnackbar('Failed to save task', 'error');
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (task) {
        await taskApi.update(id, { completed: !task.completed });
        loadTasks();
      }
    } catch (error) {
      showSnackbar('Failed to toggle task', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskApi.delete(id);
      showSnackbar('Task deleted', 'success');
      loadTasks();
    } catch (error) {
      showSnackbar('Failed to delete task', 'error');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setDialogOpen(true);
  };

  const handleSync = async () => {
    if (!googleConnected) {
      showSnackbar('Please connect your Google account first', 'error');
      return;
    }

    try {
      const preview = await taskApi.syncPreview();
      setSyncPreview(preview);
      setSyncDialogOpen(true);
    } catch (error) {
      showSnackbar('Failed to load sync preview', 'error');
    }
  };

  const handleSyncExecute = async (resolutions: SyncResolution[]) => {
    try {
      await taskApi.syncExecute(resolutions);
      showSnackbar('Sync completed successfully', 'success');
      setSyncDialogOpen(false);
      loadTasks();
    } catch (error) {
      showSnackbar('Sync failed', 'error');
    }
  };

  const handleMigrate = async () => {
    try {
      const result = await taskApi.migrate();
      showSnackbar(`Migrated ${result.migrated} tasks, skipped ${result.skipped}`, 'success');
      loadTasks();
    } catch (error) {
      showSnackbar('Migration failed', 'error');
    }
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const delta = direction === 'prev' ? -1 : 1;

    if (viewType === 'weekly') {
      newDate.setDate(newDate.getDate() + (delta * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + delta);
    }

    setCurrentDate(newDate);
  };

  const getDisplayDate = () => {
    if (viewType === 'weekly') {
      const { start, end } = getDateRange();
      const startDate = parseDateLocal(start);
      const endDate = parseDateLocal(end);
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  const groupTasksByDate = () => {
    const grouped: { [date: string]: Task[] } = {};
    tasks.forEach(task => {
      const date = task.due_date || '';
      if (date && !grouped[date]) {
        grouped[date] = [];
      }
      if (date) {
        grouped[date].push(task);
      }
    });
    return grouped;
  };

  const getWeekDays = () => {
    const { start } = getDateRange();
    const days = [];
    const [year, month, day] = start.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);
      days.push(currentDay);
    }
    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getMonthCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const calendar: Date[][] = [];
    let currentWeek: Date[] = [];
    
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        calendar.push(currentWeek);
        currentWeek = [];
      }
    }
    
    return calendar;
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getNoteActivityCount = (dateStr: string): number => {
    const activities = noteActivities[dateStr];
    if (!activities) return 0;
    return activities.created.length + activities.updated.length + activities.moved.length;
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDayViewOpen(true);
  };

  const groupedTasks = groupTasksByDate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
        <Tabs value={viewType} onChange={(_, v) => setViewType(v)}>
          <Tab label="Weekly" value="weekly" />
          <Tab label="Monthly" value="monthly" />
        </Tabs>
      </Box>

      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigateDate('prev')}>
          <ChevronLeftIcon />
        </IconButton>
        
        <Typography variant="h6" sx={{ flex: 1, textAlign: 'center' }}>
          {getDisplayDate()}
        </Typography>
        
        <IconButton onClick={() => navigateDate('next')}>
          <ChevronRightIcon />
        </IconButton>
        
        <Button
          startIcon={<TodayIcon />}
          onClick={() => navigateDate('today')}
          variant="outlined"
          size="small"
        >
          Today
        </Button>

        <Button
          startIcon={<SyncIcon />}
          onClick={handleSync}
          variant="outlined"
          size="small"
          disabled={!googleConnected}
        >
          Sync with Google
        </Button>

        <Button
          startIcon={<MigrateIcon />}
          onClick={handleMigrate}
          variant="outlined"
          size="small"
        >
          Migrate from Planner
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {viewType === 'weekly' ? (
          <Box sx={{ display: 'flex', gap: 2, minWidth: 'fit-content' }}>
            {getWeekDays().map(day => {
              const dateStr = formatDateLocal(day);
              const dayTasks = groupedTasks[dateStr] || [];
              const today = isToday(day);
              
              return (
                <Box
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  sx={{
                    flex: 1,
                    minWidth: 200,
                    border: 1,
                    borderColor: today ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    p: 2,
                    bgcolor: today ? 'primary.50' : 'background.paper',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: today ? 'primary.100' : 'action.hover',
                    },
                  }}
                >
                  {getNoteActivityCount(dateStr) > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {getNoteActivityCount(dateStr)}
                    </Box>
                  )}
                  <Typography variant="subtitle2" fontWeight={600} color={today ? 'primary' : 'text.primary'}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h6" color={today ? 'primary' : 'text.secondary'}>
                      {day.getDate()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dayTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                        linkedNotes={taskLinkedNotes[task.id] || []}
                        onNoteClick={(noteId) => onNavigateToNote?.(noteId)}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 2 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Typography key={day} variant="subtitle2" textAlign="center" fontWeight={600} color="text.secondary">
                  {day}
                </Typography>
              ))}
            </Box>
            
            {getMonthCalendar().map((week, weekIdx) => (
              <Box key={weekIdx} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                {week.map(day => {
                  const dateStr = formatDateLocal(day);
                  const dayTasks = groupedTasks[dateStr] || [];
                  const today = isToday(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  
                  return (
                    <Box
                      key={dateStr}
                      onClick={() => handleDayClick(dateStr)}
                      sx={{
                        minHeight: 100,
                        border: 1,
                        borderColor: today ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        p: 1,
                        bgcolor: today ? 'primary.50' : 'background.paper',
                        opacity: isCurrentMonth ? 1 : 0.4,
                        cursor: 'pointer',
                        position: 'relative',
                        '&:hover': {
                          bgcolor: today ? 'primary.100' : 'action.hover',
                        },
                      }}
                    >
                      {getNoteActivityCount(dateStr) > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderRadius: '50%',
                            width: 16,
                            height: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            fontWeight: 600,
                          }}
                        >
                          {getNoteActivityCount(dateStr)}
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Typography 
                          variant="body2" 
                          fontWeight={today ? 600 : 400}
                          color={today ? 'primary' : isCurrentMonth ? 'text.primary' : 'text.secondary'}
                        >
                          {day.getDate()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {dayTasks.slice(0, 3).map(task => (
                          <Typography
                            key={task.id}
                            variant="caption"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textDecoration: task.completed ? 'line-through' : 'none',
                              color: task.completed ? 'text.disabled' : 'text.primary',
                            }}
                          >
                            {task.title}
                          </Typography>
                        ))}
                        {dayTasks.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{dayTasks.length - 3} more
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {
          setEditTask(null);
          setDialogOpen(true);
        }}
      >
        <AddIcon />
      </Fab>

      <CreateTaskDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditTask(null);
        }}
        onSave={handleCreateTask}
        editTask={editTask}
      />

      <SyncPreviewDialog
        open={syncDialogOpen}
        onClose={() => setSyncDialogOpen(false)}
        preview={syncPreview}
        onExecute={handleSyncExecute}
      />

      <DayViewModal
        open={dayViewOpen}
        onClose={() => setDayViewOpen(false)}
        date={selectedDate}
        activities={selectedDate ? noteActivities[selectedDate] : null}
        tasks={selectedDate ? groupedTasks[selectedDate] || [] : []}
        taskLinkedNotes={taskLinkedNotes}
        onOpenNote={(noteId) => onNavigateToNote?.(noteId)}
        onToggleComplete={handleToggleComplete}
        onDeleteTask={handleDeleteTask}
        onEditTask={handleEditTask}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          sx={
            snackbar.severity === 'error'
              ? {
                  bgcolor: theme.palette.error.main,
                  color: theme.palette.error.contrastText,
                  '& .MuiAlert-icon': { color: theme.palette.error.contrastText },
                }
              : undefined
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlannerView;