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
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { Theme, Settings } from '../types';
import { settingsApi } from '../services/api';
import ThemeList from './ThemeList';
import ThemeEditor from './ThemeEditor';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSettingsChange: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsApi.getSettings();
      setSettings(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setEditingThemeId(null);
    setEditingTheme(null);
  };

  const handleEditTheme = (themeId: string, theme: Theme) => {
    setEditingThemeId(themeId);
    setEditingTheme(theme);
    setIsCreatingNew(false);
  };

  const handleCancelEdit = () => {
    setIsCreatingNew(false);
    setEditingThemeId(null);
    setEditingTheme(null);
  };

  const handleSaveTheme = async (theme: Theme) => {
    try {
      setLoading(true);
      setError(null);

      if (editingThemeId) {
        // Update existing theme
        await settingsApi.updateTheme(editingThemeId, theme);
      } else {
        // Create new theme
        await settingsApi.createTheme(theme);
      }

      await loadSettings();
      handleCancelEdit();
      onSettingsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save theme');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTheme = async (themeId: string) => {
    try {
      setLoading(true);
      setError(null);
      await settingsApi.setActiveTheme(themeId);
      await loadSettings();
      onSettingsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to apply theme');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await settingsApi.deleteTheme(themeId);
      await loadSettings();
      onSettingsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete theme');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!window.confirm('Are you sure you want to reset to default theme? This will delete all custom themes.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await settingsApi.resetToDefault();
      await loadSettings();
      onSettingsChange();
      handleCancelEdit();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset to default');
    } finally {
      setLoading(false);
    }
  };

  const showingEditor = isCreatingNew || editingThemeId !== null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Settings
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && <Box sx={{ textAlign: 'center', py: 4 }}>Loading...</Box>}

        {!loading && settings && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                disabled={showingEditor}
              >
                Create New Theme
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleResetToDefault}
                color="error"
              >
                Reset to Default
              </Button>
            </Box>

            <Divider />

            {/* Main Content */}
            {showingEditor ? (
              <ThemeEditor
                initialTheme={editingTheme || undefined}
                onSave={handleSaveTheme}
                onCancel={handleCancelEdit}
              />
            ) : (
              <ThemeList
                themes={settings.themes}
                activeThemeId={settings.activeTheme}
                onApply={handleApplyTheme}
                onEdit={handleEditTheme}
                onDelete={handleDeleteTheme}
              />
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;