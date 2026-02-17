import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Theme, Settings } from '../types';
import { settingsApi } from '../services/api';
import ThemeList from './ThemeList';
import ThemeEditor from './ThemeEditor';
import { defaultColors } from '../design-system/colors';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSettingsChange: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleCreateNew = () => {
    setEditingTheme(null);
    setShowEditor(true);
  };

  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme);
    setShowEditor(true);
  };

  const handleSaveTheme = async (themeData: Omit<Theme, 'id'>) => {
    try {
      if (editingTheme) {
        await settingsApi.updateTheme(editingTheme.id, themeData);
      } else {
        await settingsApi.createTheme(themeData);
      }
      await loadSettings();
      setShowEditor(false);
      setEditingTheme(null);
      onSettingsChange();
    } catch (error) {
      console.error('Failed to save theme:', error);
      alert('Failed to save theme');
    }
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingTheme(null);
  };

  const handleApplyTheme = async (themeId: string) => {
    try {
      await settingsApi.setActiveTheme(themeId);
      await loadSettings();
      onSettingsChange();
    } catch (error) {
      console.error('Failed to apply theme:', error);
      alert('Failed to apply theme');
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    try {
      await settingsApi.deleteTheme(themeId);
      await loadSettings();
      onSettingsChange();
    } catch (error) {
      console.error('Failed to delete theme:', error);
      alert('Failed to delete theme');
    }
  };

  const handleReset = async () => {
    try {
      await settingsApi.reset();
      await loadSettings();
      setConfirmReset(false);
      onSettingsChange();
    } catch (error) {
      console.error('Failed to reset settings:', error);
      alert('Failed to reset settings');
    }
  };

  if (!settings) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Theme Settings</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleCreateNew}>
            Create New Theme
          </Button>
          {confirmReset ? (
            <>
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleReset}
              >
                Confirm Reset to Default
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button 
              variant="outlined" 
              color="warning"
              onClick={() => setConfirmReset(true)}
            >
              Reset to Default
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: showEditor ? 'row' : 'column' }}>
          <Box sx={{ flex: showEditor ? 1 : 'auto' }}>
            <ThemeList
              themes={settings.themes}
              activeThemeId={settings.active_theme_id}
              onApply={handleApplyTheme}
              onEdit={handleEdit}
              onDelete={handleDeleteTheme}
            />
          </Box>
          {showEditor && (
            <Box sx={{ flex: 1 }}>
              <ThemeEditor
                theme={editingTheme}
                onSave={handleSaveTheme}
                onCancel={handleCancelEdit}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;