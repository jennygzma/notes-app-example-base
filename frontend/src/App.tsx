import React, { useState, useEffect, useMemo } from 'react';
import { Box, Tabs, Tab, AppBar, IconButton, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Settings as SettingsIcon } from '@mui/icons-material';
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
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.getSettings();
      setSettings(response.data);
      const active = response.data.themes.find(
        (t) => t.id === response.data.active_theme_id
      );
      setActiveTheme(active || response.data.themes[0]);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const muiTheme = useMemo(() => {
    if (!activeTheme) return createTheme();
    
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
  }, [activeTheme]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
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

  const handleApplyTheme = async (themeId: string) => {
    try {
      await settingsApi.setActiveTheme(themeId);
      await loadSettings();
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  const handleCreateTheme = async (theme: Theme) => {
    try {
      await settingsApi.createTheme(theme);
      await loadSettings();
    } catch (error) {
      console.error('Failed to create theme:', error);
    }
  };

  const handleUpdateTheme = async (themeId: string, theme: Theme) => {
    try {
      await settingsApi.updateTheme(themeId, theme);
      await loadSettings();
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    try {
      await settingsApi.deleteTheme(themeId);
      await loadSettings();
    } catch (error) {
      console.error('Failed to delete theme:', error);
    }
  };

  const handleResetToDefault = async () => {
    try {
      await settingsApi.resetToDefault();
      await loadSettings();
    } catch (error) {
      console.error('Failed to reset to default:', error);
    }
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tabs value={currentTab} onChange={handleTabChange} sx={{ flex: 1 }}>
              <Tab label="Notes" />
              <Tab label="Inspirations" />
              <Tab label="Planner" />
            </Tabs>
            <IconButton onClick={handleOpenSettings} sx={{ mr: 2 }}>
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

        {settings && (
          <SettingsDialog
            open={settingsOpen}
            onClose={handleCloseSettings}
            settings={settings}
            activeThemeId={settings.active_theme_id}
            onApply={handleApplyTheme}
            onCreate={handleCreateTheme}
            onUpdate={handleUpdateTheme}
            onDelete={handleDeleteTheme}
            onReset={handleResetToDefault}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
