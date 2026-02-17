import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Theme } from '../types';

interface ThemeListProps {
  themes: { [themeId: string]: Theme };
  activeThemeId: string;
  onApplyTheme: (themeId: string) => void;
  onEditTheme: (themeId: string, theme: Theme) => void;
  onDeleteTheme: (themeId: string) => void;
}

const ThemeList: React.FC<ThemeListProps> = ({
  themes,
  activeThemeId,
  onApplyTheme,
  onEditTheme,
  onDeleteTheme,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Saved Themes</Typography>

      {Object.entries(themes).map(([themeId, theme]) => {
        const isActive = themeId === activeThemeId;
        const isDeletable = themeId !== 'default';

        return (
          <Card
            key={themeId}
            elevation={isActive ? 4 : 1}
            sx={{
              position: 'relative',
              backgroundColor: isActive ? 'action.selected' : 'background.paper',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {theme.name}
                    </Typography>
                    {isActive && (
                      <CheckCircleIcon color="primary" fontSize="small" />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Font: <span style={{ fontFamily: theme.font }}>{theme.font}</span>
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label="Primary"
                      size="small"
                      sx={{
                        backgroundColor: theme.colors.primary,
                        color: '#fff',
                      }}
                    />
                    <Chip
                      label="Secondary"
                      size="small"
                      sx={{
                        backgroundColor: theme.colors.secondary,
                        color: '#fff',
                      }}
                    />
                    <Chip
                      label="Background"
                      size="small"
                      sx={{
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        border: '1px solid #ddd',
                      }}
                    />
                    <Chip
                      label="Text"
                      size="small"
                      sx={{
                        backgroundColor: theme.colors.text,
                        color: theme.colors.background,
                      }}
                    />
                  </Stack>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!isActive && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => onApplyTheme(themeId)}
                      >
                        Apply
                      </Button>
                    )}
                    {isActive && (
                      <Chip label="Active" color="primary" size="small" />
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => onEditTheme(themeId, theme)}
                    disabled={!isDeletable}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  {isDeletable && (
                    <IconButton
                      size="small"
                      onClick={() => onDeleteTheme(themeId)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default ThemeList;