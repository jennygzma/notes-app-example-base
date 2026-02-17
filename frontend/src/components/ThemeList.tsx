import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  IconButton
} from '@mui/material';
import { Theme } from '../types';

interface ThemeListProps {
  themes: Theme[];
  activeThemeId: string;
  onApply: (themeId: string) => void;
  onEdit: (theme: Theme) => void;
  onDelete: (themeId: string) => void;
}

const ThemeList: React.FC<ThemeListProps> = ({
  themes,
  activeThemeId,
  onApply,
  onEdit,
  onDelete
}) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDeleteClick = (themeId: string) => {
    if (themeId === 'default') {
      alert('Cannot delete the default theme');
      return;
    }
    setConfirmDelete(themeId);
  };

  const handleConfirmDelete = (themeId: string) => {
    onDelete(themeId);
    setConfirmDelete(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Your Themes
      </Typography>
      <Stack spacing={2}>
        {themes.map((theme) => {
          const isActive = theme.id === activeThemeId;
          const isConfirming = confirmDelete === theme.id;

          return (
            <Card 
              key={theme.id}
              sx={{
                backgroundColor: isActive ? 'action.selected' : 'background.paper',
                border: isActive ? 2 : 1,
                borderColor: isActive ? 'primary.main' : 'divider'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {theme.name}
                      {isActive && (
                        <Chip 
                          label="Active" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: theme.font }}>
                      Font: {theme.font}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: theme.colors.primary,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                    title="Primary"
                  />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: theme.colors.secondary,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                    title="Secondary"
                  />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: theme.colors.background,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                    title="Background"
                  />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: theme.colors.text,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                    title="Text"
                  />
                </Box>

                {isConfirming ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => handleConfirmDelete(theme.id)}
                    >
                      Confirm Delete
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setConfirmDelete(null)}
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!isActive && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => onApply(theme.id)}
                      >
                        Apply
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onEdit(theme)}
                    >
                      Edit
                    </Button>
                    {theme.id !== 'default' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteClick(theme.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default ThemeList;