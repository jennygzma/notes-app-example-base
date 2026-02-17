import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, AppBar, IconButton, ThemeProvider, createTheme } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import NotesView from './components/NotesView';
import InspirationsView from './components/InspirationsView';
import PlannerView from './components/PlannerView';
import SettingsDialog from './components/SettingsDialog';
import { settingsApi } from './services/api';
import { Settings } from './types';

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.getSettings();
      setSettings(response.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleThemeChange = () => {
    loadSettings();
  };

  const theme = React.useMemo(() => {
    if (!settings) {
      return createTheme();
    }

    const activeTheme = settings.themes[settings.activeTheme];
    if (!activeTheme) {
      return createTheme();
    }

    return createTheme({
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
  }, [settings]);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default' }}>
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
              aria-label="settings"
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

        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onThemeChange={handleThemeChange}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
