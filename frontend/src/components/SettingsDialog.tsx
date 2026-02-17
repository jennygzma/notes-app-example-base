import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import ThemeList from './ThemeList';
import ThemeEditor from './ThemeEditor';

interface Theme {
  id?: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  font: string;
}

interface Settings {
  active_theme_id: string;
  themes: Theme[];
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: Settings | null;
  activeThemeId: string;
  onApply: (themeId: string) => void;
  onCreate: (theme: Theme) => void;
  onUpdate: (themeId: string, theme: Theme) => void;
  onDelete: (themeId: string) => void;
  onReset: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  settings,
  activeThemeId,
  onApply,
  onCreate,
  onUpdate,
  onDelete,
  onReset,
}) => {
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [draftTheme, setDraftTheme] = useState<Theme>({
    name: 'New Theme',
    colors: { primary: '#1976d2', secondary: '#dc004e', background: '#ffffff', text: '#000000' },
    font: 'Roboto',
  });
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');

  const handleEdit = (themeId: string) => {
    const theme = settings?.themes.find((t) => t.id === themeId);
    if (theme) {
      setDraftTheme(theme);
      setEditingThemeId(themeId);
      setEditorMode('edit');
    }
  };

  const handleCreateNew = () => {
    setDraftTheme({
      name: 'New Theme',
      colors: { primary: '#1976d2', secondary: '#dc004e', background: '#ffffff', text: '#000000' },
      font: 'Roboto',
    });
    setEditingThemeId(null);
    setEditorMode('create');
  };

  const handleSave = (theme: Theme) => {
    if (editorMode === 'create') {
      onCreate(theme);
    } else if (editingThemeId) {
      onUpdate(editingThemeId, theme);
    }
    handleCreateNew();
  };

  const handleCancel = () => {
    handleCreateNew();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        {settings && (
          <Box sx={{ display: 'flex', gap: 2, height: '500px' }}>
            <Box sx={{ flex: '0 0 40%', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
              <ThemeList
                themes={settings.themes}
                activeThemeId={activeThemeId}
                onApply={onApply}
                onEdit={handleEdit}
                onDelete={onDelete}
              />
            </Box>
            <Box sx={{ flex: '1', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
              <ThemeEditor
                draftTheme={draftTheme}
                mode={editorMode}
                onChange={setDraftTheme}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Button onClick={handleCreateNew} variant="contained" color="primary" sx={{ mr: 1 }}>
            Create New Theme
          </Button>
          <Button onClick={onReset} variant="outlined" color="secondary">
            Reset to Default
          </Button>
        </Box>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;