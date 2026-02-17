import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import { Theme } from '../types';
import { webSafeFonts } from '../design-system/colors';

interface ThemeEditorProps {
  initialTheme?: Theme;
  onSave: (theme: Theme) => void;
  onCancel: () => void;
}

const ThemeEditor: React.FC<ThemeEditorProps> = ({ initialTheme, onSave, onCancel }) => {
  const [themeName, setThemeName] = useState(initialTheme?.name || '');
  const [primaryColor, setPrimaryColor] = useState(initialTheme?.colors.primary || '#1976d2');
  const [secondaryColor, setSecondaryColor] = useState(initialTheme?.colors.secondary || '#dc004e');
  const [backgroundColor, setBackgroundColor] = useState(initialTheme?.colors.background || '#ffffff');
  const [textColor, setTextColor] = useState(initialTheme?.colors.text || '#000000');
  const [font, setFont] = useState(initialTheme?.font || 'Roboto');

  useEffect(() => {
    if (initialTheme) {
      setThemeName(initialTheme.name);
      setPrimaryColor(initialTheme.colors.primary);
      setSecondaryColor(initialTheme.colors.secondary);
      setBackgroundColor(initialTheme.colors.background);
      setTextColor(initialTheme.colors.text);
      setFont(initialTheme.font);
    }
  }, [initialTheme]);

  const handleSave = () => {
    if (!themeName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    const theme: Theme = {
      name: themeName.trim(),
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        background: backgroundColor,
        text: textColor,
      },
      font,
    };

    onSave(theme);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6">
        {initialTheme ? 'Edit Theme' : 'Create New Theme'}
      </Typography>

      {/* Theme Name */}
      <TextField
        label="Theme Name"
        value={themeName}
        onChange={(e) => setThemeName(e.target.value)}
        fullWidth
        required
      />

      {/* Color Pickers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Box>
          <Typography variant="body2" gutterBottom>
            Primary Color
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{ width: 50, height: 40, cursor: 'pointer', border: '1px solid #ccc' }}
            />
            <TextField
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              size="small"
              fullWidth
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="body2" gutterBottom>
            Secondary Color
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              style={{ width: 50, height: 40, cursor: 'pointer', border: '1px solid #ccc' }}
            />
            <TextField
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              size="small"
              fullWidth
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="body2" gutterBottom>
            Background Color
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              style={{ width: 50, height: 40, cursor: 'pointer', border: '1px solid #ccc' }}
            />
            <TextField
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              size="small"
              fullWidth
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="body2" gutterBottom>
            Text Color
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{ width: 50, height: 40, cursor: 'pointer', border: '1px solid #ccc' }}
            />
            <TextField
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              size="small"
              fullWidth
            />
          </Box>
        </Box>
      </Box>

      {/* Font Selector */}
      <FormControl fullWidth>
        <InputLabel>Font</InputLabel>
        <Select value={font} onChange={(e) => setFont(e.target.value)} label="Font">
          {webSafeFonts.map((fontOption) => (
            <MenuItem key={fontOption} value={fontOption} style={{ fontFamily: fontOption }}>
              {fontOption}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Live Preview */}
      <Paper elevation={2} sx={{ p: 3, backgroundColor, color: textColor }}>
        <Typography variant="h6" gutterBottom sx={{ fontFamily: font }}>
          Live Preview
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: font, mb: 2 }}>
          The quick brown fox jumps over the lazy dog
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: primaryColor,
              color: '#fff',
              fontFamily: font,
              '&:hover': { backgroundColor: primaryColor, opacity: 0.9 },
            }}
          >
            Primary Button
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: secondaryColor,
              color: '#fff',
              fontFamily: font,
              '&:hover': { backgroundColor: secondaryColor, opacity: 0.9 },
            }}
          >
            Secondary Button
          </Button>
        </Box>
        <Card sx={{ backgroundColor: '#fff', border: '1px solid #ddd' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontFamily: font, color: textColor }}>
              Sample Card
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: font, color: textColor }}>
              This is a sample card showing how your theme will look in the application.
            </Typography>
          </CardContent>
        </Card>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Save Theme
        </Button>
      </Box>
    </Box>
  );
};

export default ThemeEditor;