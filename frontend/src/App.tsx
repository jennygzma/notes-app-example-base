import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, AppBar, IconButton, ThemeProvider, createTheme } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import NotesView from './components/NotesView';
import InspirationsView from './components/InspirationsView';
import PlannerView from './components/PlannerView';
import SettingsDialog from './components/SettingsDialog';
import { settingsApi } from './services/api';
import { Settings, Theme } from './types';

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleNavigateToNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setCurrentTab(0);
  };

  const handleNavigateToTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentTab(2);
  };

  const handleNavigateToInspiration = (category: string) => {
    setSelectedCategory(category);
    setCurrentTab(1);
  };

  const handleSettingsChange = () => {
    loadSettings();
  };

  const activeTheme = settings?.themes.find(t => t.id === settings.active_theme_id) || {
    id: 'default',
    name: 'Default',
    colors: {
      primary: '#1976d2',
      secondary: '#dc004e',
      background: '#ffffff',
      text: '#000000'
    },
    font: 'Roboto'
  };

  const theme = createTheme({
    palette: {
      primary: { main: activeTheme.colors.primary },
      secondary: { main: activeTheme.colors.secondary },
      background: { default: activeTheme.colors.background },
      text: { primary: activeTheme.colors.text },
    },
    typography: {
      fontFamily: activeTheme.font,
    },
  });

  return (
    <ThemeProvider theme={theme}>
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ flex: 1 }}>
            <Tab label="Notes" />
            <Tab label="Inspirations" />
            <Tab label="Planner" />
          </Tabs>
          <IconButton 
            onClick={() => setSettingsOpen(true)}
            sx={{ mr: 2 }}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {currentTab === 0 && (
          <NotesView 
            initialSelectedNoteId={selectedNoteId}
            onNavigateToTask={handleNavigateToTask}
            onNavigateToInspiration={handleNavigateToInspiration}
          />
        )}
        {currentTab === 1 && (
          <InspirationsView 
            onNoteClick={handleNavigateToNote}
            initialSelectedCategory={selectedCategory}
          />
        )}
        {currentTab === 2 && (
          <PlannerView 
            initialSelectedTaskId={selectedTaskId}
            onNavigateToNote={handleNavigateToNote}
          />
          )}
        </Box>
      </Box>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={handleSettingsChange}
      />
    </ThemeProvider>
  );
}

export default App;
