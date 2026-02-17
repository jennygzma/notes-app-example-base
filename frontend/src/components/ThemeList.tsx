import React from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Stack } from '@mui/material';

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

interface ThemeListProps {
  themes: Theme[];
  activeThemeId: string;
  onApply: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ThemeList: React.FC<ThemeListProps> = ({
  themes,
  activeThemeId,
  onApply,
  onEdit,
  onDelete,
}) => {
  return (
    <Box sx={{ overflowY: 'auto', height: '100%' }}>
      <Stack spacing={2}>
        {themes.map((theme) => {
          const isActive = theme.id === activeThemeId;
          return (
            <Card
              key={theme.id || theme.name}
              sx={{
                backgroundColor: isActive ? 'action.selected' : 'background.paper',
                border: isActive ? 2 : 1,
                borderColor: isActive ? 'primary.main' : 'divider',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {theme.name}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Colors:
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label="Primary"
                      size="small"
                      sx={{ backgroundColor: theme.colors.primary, color: '#fff' }}
                    />
                    <Chip
                      label="Secondary"
                      size="small"
                      sx={{ backgroundColor: theme.colors.secondary, color: '#fff' }}
                    />
                    <Chip
                      label="Background"
                      size="small"
                      sx={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
                    />
                  </Stack>
                </Box>

                <Typography variant="caption" display="block" gutterBottom>
                  Font: {theme.font}
                </Typography>
                <Typography sx={{ fontFamily: theme.font, mb: 2 }}>
                  Sample Text
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onApply(theme.id!)}
                    disabled={isActive}
                  >
                    {isActive ? 'Active' : 'Apply'}
                  </Button>
                  <Button size="small" onClick={() => onEdit(theme.id!)}>
                    Edit
                  </Button>
                  {theme.id !== 'default' && (
                    <Button size="small" color="error" onClick={() => onDelete(theme.id!)}>
                      Delete
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default ThemeList;