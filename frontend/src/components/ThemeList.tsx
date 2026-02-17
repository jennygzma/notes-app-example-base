import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Grid,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Check as CheckIcon } from '@mui/icons-material';
import { Theme } from '../types';

interface ThemeListProps {
  themes: { [themeId: string]: Theme };
  activeThemeId: string;
  onApply: (themeId: string) => void;
  onEdit: (themeId: string, theme: Theme) => void;
  onDelete: (themeId: string) => void;
}

const ThemeList: React.FC<ThemeListProps> = ({
  themes,
  activeThemeId,
  onApply,
  onEdit,
  onDelete,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Saved Themes</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {Object.entries(themes).map(([themeId, theme]) => {
          const isActive = themeId === activeThemeId;
          const isDefault = themeId === 'default';

          return (
            <Box key={themeId}>
              <Card
                sx={{
                  border: isActive ? '2px solid #1976d2' : '1px solid #ddd',
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: '#1976d2',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckIcon fontSize="small" />
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {theme.name}
                  </Typography>

                  {/* Color Chips */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" display="block" gutterBottom>
                      Colors
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                    </Box>
                  </Box>

                  {/* Font Sample */}
                  <Box>
                    <Typography variant="caption" display="block" gutterBottom>
                      Font: {theme.font}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: theme.font, fontStyle: 'italic' }}
                    >
                      The quick brown fox
                    </Typography>
                  </Box>
                </CardContent>

                {/* Action Buttons */}
                <Box
                  sx={{
                    p: 2,
                    pt: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => onEdit(themeId, theme)}
                      title="Edit theme"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {!isDefault && (
                      <IconButton
                        size="small"
                        onClick={() => onDelete(themeId)}
                        title="Delete theme"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  {!isActive && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => onApply(themeId)}
                    >
                      Apply
                    </Button>
                  )}
                  {isActive && (
                    <Chip label="Active" size="small" color="primary" />
                  )}
                </Box>
              </Card>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ThemeList;