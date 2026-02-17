import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Theme, Settings } from '../types';
import { settingsApi } from '../services/api';
import ThemeList from './ThemeList';
import ThemeEditor from './ThemeEditor';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onThemeChange: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose, onThemeChange }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await settingsApi.getSettings();
      setSettings(response.data);
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsEditing(true);
    setEditingThemeId(null);
    setEditingTheme(null);
  };

  const handleEdit = (themeId: string, theme: Theme) => {
    setIsEditing(true);
    setEditingThemeId(themeId);
    setEditingTheme(theme);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingThemeId(null);
    setEditingTheme(null);
  };

  const handleSaveTheme = async (theme: Theme) => {
    setError(null);
    try {
      if (editingThemeId) {
        // Update existing theme
        await settingsApi.updateTheme(editingThemeId, theme);
      } else {
        // Create new theme
        await settingsApi.createTheme(theme);
      }
      await loadSettings();
      setIsEditing(false);
      setEditingThemeId(null);
      setEditingTheme(null);
    } catch (err) {
      setError('Failed to save theme');
      console.error(err);
    }
  };

  const handleApplyTheme = async (themeId: string) => {
    setError(null);
    try {
      await settingsApi.setActiveTheme(themeId);
      await loadSettings();
      onThemeChange();
    } catch (err) {
      setError('Failed to apply theme');
      console.error(err);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) {
      return;
    }
    setError(null);
    try {
      await settingsApi.deleteTheme(themeId);
      await loadSettings();
      onThemeChange();
    } catch (err) {
      setError('Failed to delete theme');
      console.error(err);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('This will delete all custom themes and reset to default. Continue?')) {
      return;
    }
    setError(null);
    try {
      await settingsApi.resetToDefault();
      await loadSettings();
      onThemeChange();
    } catch (err) {
      setError('Failed to reset settings');
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Settings
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && settings && (
          <Box>
            {!isEditing ? (
              <Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateNew}
                  >
                    Create New Theme
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    onClick={handleReset}
                    color="warning"
                  >
                    Reset to Default
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <ThemeList
                  themes={settings.themes}
                  activeThemeId={settings.activeTheme}
                  onApplyTheme={handleApplyTheme}
                  onEditTheme={handleEdit}
                  onDeleteTheme={handleDeleteTheme}
                />
              </Box>
            ) : (
              <ThemeEditor
                initialTheme={editingTheme || undefined}
                onSave={handleSaveTheme}
                onCancel={handleCancelEdit}
              />
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;