import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import { Theme } from '../types';

const WEB_SAFE_FONTS = [
  'Roboto',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Comic Sans MS',
  'Impact',
];

interface ThemeEditorProps {
  initialTheme?: Theme;
  onSave: (theme: Theme) => void;
  onCancel: () => void;
}

const ThemeEditor: React.FC<ThemeEditorProps> = ({ initialTheme, onSave, onCancel }) => {
  const [theme, setTheme] = useState<Theme>(
    initialTheme || {
      name: '',
      colors: {
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#ffffff',
        text: '#000000',
      },
      font: 'Roboto',
    }
  );

  useEffect(() => {
    if (initialTheme) {
      setTheme(initialTheme);
    }
  }, [initialTheme]);

  const handleColorChange = (colorKey: keyof Theme['colors'], value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  };

  const handleSubmit = () => {
    if (!theme.name.trim()) {
      alert('Please enter a theme name');
      return;
    }
    onSave(theme);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {initialTheme ? 'Edit Theme' : 'Create New Theme'}
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Theme Name"
              value={theme.name}
              onChange={(e) => setTheme({ ...theme, name: e.target.value })}
              fullWidth
              required
            />

            <Typography variant="subtitle2" sx={{ mt: 2 }}>Colors</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ minWidth: 100 }}>Primary:</Typography>
              <input
                type="color"
                value={theme.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                style={{ width: 50, height: 40, cursor: 'pointer' }}
              />
              <TextField
                value={theme.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                size="small"
                sx={{ width: 100 }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ minWidth: 100 }}>Secondary:</Typography>
              <input
                type="color"
                value={theme.colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                style={{ width: 50, height: 40, cursor: 'pointer' }}
              />
              <TextField
                value={theme.colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                size="small"
                sx={{ width: 100 }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ minWidth: 100 }}>Background:</Typography>
              <input
                type="color"
                value={theme.colors.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
                style={{ width: 50, height: 40, cursor: 'pointer' }}
              />
              <TextField
                value={theme.colors.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
                size="small"
                sx={{ width: 100 }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ minWidth: 100 }}>Text:</Typography>
              <input
                type="color"
                value={theme.colors.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
                style={{ width: 50, height: 40, cursor: 'pointer' }}
              />
              <TextField
                value={theme.colors.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
                size="small"
                sx={{ width: 100 }}
              />
            </Box>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Font</InputLabel>
              <Select
                value={theme.font}
                label="Font"
                onChange={(e) => setTheme({ ...theme, font: e.target.value })}
              >
                {WEB_SAFE_FONTS.map((font) => (
                  <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="contained" onClick={handleSubmit} fullWidth>
                Save Theme
              </Button>
              <Button variant="outlined" onClick={onCancel} fullWidth>
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              fontFamily: theme.font,
              minHeight: 400,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: theme.colors.text }}>
              Live Preview
            </Typography>

            <Typography paragraph sx={{ color: theme.colors.text }}>
              The quick brown fox jumps over the lazy dog
            </Typography>

            <Typography variant="body2" paragraph sx={{ color: theme.colors.text }}>
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </Typography>

            <Typography variant="body2" paragraph sx={{ color: theme.colors.text }}>
              abcdefghijklmnopqrstuvwxyz
            </Typography>

            <Typography variant="body2" paragraph sx={{ color: theme.colors.text }}>
              0123456789
            </Typography>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: theme.colors.primary,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: theme.colors.primary,
                    opacity: 0.9,
                  },
                }}
              >
                Primary Button
              </Button>

              <Button
                variant="contained"
                sx={{
                  backgroundColor: theme.colors.secondary,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: theme.colors.secondary,
                    opacity: 0.9,
                  },
                }}
              >
                Secondary Button
              </Button>
            </Box>

            <Paper
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: theme.colors.primary,
                color: '#fff',
              }}
            >
              <Typography variant="subtitle2">Sample Card</Typography>
              <Typography variant="body2">
                This is how content will look with your theme
              </Typography>
            </Paper>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ThemeEditor;