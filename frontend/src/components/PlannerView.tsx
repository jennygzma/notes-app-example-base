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
  Button,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import CreateTaskDialog from './CreateTaskDialog';
import TaskItem from './TaskItem';
import { PlannerItem, CreatePlannerItemRequest, Note } from '../types';
import { plannerApi } from '../services/api';

type ViewType = 'weekly' | 'monthly';

interface PlannerViewProps {
  initialSelectedTaskId?: string | null;
  onNavigateToNote?: (noteId: string) => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ initialSelectedTaskId, onNavigateToNote }) => {
  const [viewType, setViewType] = useState<ViewType>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<PlannerItem[]>([]);
  const [taskLinkedNotes, setTaskLinkedNotes] = useState<{ [taskId: string]: Note[] }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<PlannerItem | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadTasks();
  }, [currentDate, viewType]);

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewType === 'weekly') {
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      end.setDate(end.getDate() + (6 - dayOfWeek));
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    } else {
      // monthly
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    }
  };

  const loadTasks = async () => {
    const { start, end } = getDateRange();
    const response = await plannerApi.getItems({ 
      date_start: start, 
      date_end: end,
      view_type: viewType
    });
    if (response.error) {
      showSnackbar('Failed to load tasks', 'error');
      return;
    }
    const tasksData = response.data;
    setTasks(tasksData);
    
    // Load linked notes for each task
    const linksMap: { [taskId: string]: Note[] } = {};
    for (const task of tasksData) {
      const notesResponse = await plannerApi.getLinks(task.id);
      if (notesResponse.error) {
        linksMap[task.id] = [];
      } else {
        linksMap[task.id] = notesResponse.data;
      }
    }
    setTaskLinkedNotes(linksMap);
  };

  const handleCreateTask = async (task: CreatePlannerItemRequest) => {
    try {
      if (editTask) {
        await plannerApi.update(editTask.id, task);
        showSnackbar('Task updated', 'success');
      } else {
        await plannerApi.create(task);
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
      await plannerApi.toggleComplete(id);
      loadTasks();
    } catch (error) {
      showSnackbar('Failed to toggle task', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Delete this task?')) {
      try {
        await plannerApi.delete(id);
        showSnackbar('Task deleted', 'success');
        loadTasks();
      } catch (error) {
        showSnackbar('Failed to delete task', 'error');
      }
    }
  };

  const handleEditTask = (task: PlannerItem) => {
    setEditTask(task);
    setDialogOpen(true);
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
      // monthly
      newDate.setMonth(newDate.getMonth() + delta);
    }

    setCurrentDate(newDate);
  };

  const getDisplayDate = () => {
    if (viewType === 'weekly') {
      const { start, end } = getDateRange();
      return `${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      // monthly
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  const groupTasksByDate = () => {
    const grouped: { [date: string]: PlannerItem[] } = {};
    tasks.forEach(task => {
      if (!grouped[task.date]) {
        grouped[task.date] = [];
      }
      grouped[task.date].push(task);
    });
    return grouped;
  };

  const getWeekDays = () => {
    const { start } = getDateRange();
    const days = [];
    // Parse the date string properly to avoid timezone issues
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
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the first week
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Build 6 weeks (42 days) to cover all possible month layouts
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

  const groupedTasks = groupTasksByDate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
        <Tabs value={viewType} onChange={(_, v) => setViewType(v)}>
          <Tab label="Weekly" value="weekly" />
          <Tab label="Monthly" value="monthly" />
        </Tabs>
      </Box>

      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
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
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {viewType === 'weekly' ? (
          // Weekly view: 7 day cards
          <Box sx={{ display: 'flex', gap: 2, minWidth: 'fit-content' }}>
            {getWeekDays().map(day => {
              const dateStr = day.toISOString().split('T')[0];
              const dayTasks = groupedTasks[dateStr] || [];
              const today = isToday(day);
              
              return (
                <Box
                  key={dateStr}
                  sx={{
                    flex: 1,
                    minWidth: 200,
                    border: 1,
                    borderColor: today ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    p: 2,
                    bgcolor: today ? 'primary.50' : 'background.paper',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} color={today ? 'primary' : 'text.primary'}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Typography>
                  <Typography variant="h6" color={today ? 'primary' : 'text.secondary'} sx={{ mb: 2 }}>
                    {day.getDate()}
                  </Typography>
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
          // Monthly view: Calendar grid
          <Box>
            {/* Day headers */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 2 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Typography key={day} variant="subtitle2" textAlign="center" fontWeight={600} color="text.secondary">
                  {day}
                </Typography>
              ))}
            </Box>
            
            {/* Calendar grid */}
            {getMonthCalendar().map((week, weekIdx) => (
              <Box key={weekIdx} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                {week.map(day => {
                  const dateStr = day.toISOString().split('T')[0];
                  const dayTasks = groupedTasks[dateStr] || [];
                  const today = isToday(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  
                  return (
                    <Box
                      key={dateStr}
                      sx={{
                        minHeight: 100,
                        border: 1,
                        borderColor: today ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        p: 1,
                        bgcolor: today ? 'primary.50' : 'background.paper',
                        opacity: isCurrentMonth ? 1 : 0.4,
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        fontWeight={today ? 600 : 400}
                        color={today ? 'primary' : isCurrentMonth ? 'text.primary' : 'text.secondary'}
                      >
                        {day.getDate()}
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {dayTasks.slice(0, 3).map(task => (
                          <Typography
                            key={task.id}
                            variant="caption"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                              color: task.status === 'completed' ? 'text.disabled' : 'text.primary',
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlannerView;
