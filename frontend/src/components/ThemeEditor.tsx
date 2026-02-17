import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Stack
} from '@mui/material';
import { Theme } from '../types';
import { defaultColors, webSafeFonts } from '../design-system/colors';

interface ThemeEditorProps {
  theme: Theme | null;
  onSave: (theme: Omit<Theme, 'id'>) => void;
  onCancel: () => void;
}

const ThemeEditor: React.FC<ThemeEditorProps> = ({ theme, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState(defaultColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(defaultColors.secondary);
  const [backgroundColor, setBackgroundColor] = useState(defaultColors.background);
  const [textColor, setTextColor] = useState(defaultColors.text);
  const [font, setFont] = useState('Roboto');

  useEffect(() => {
    if (theme) {
      setName(theme.name);
      setPrimaryColor(theme.colors.primary);
      setSecondaryColor(theme.colors.secondary);
      setBackgroundColor(theme.colors.background);
      setTextColor(theme.colors.text);
      setFont(theme.font);
    } else {
      setName('');
      setPrimaryColor(defaultColors.primary);
      setSecondaryColor(defaultColors.secondary);
      setBackgroundColor(defaultColors.background);
      setTextColor(defaultColors.text);
      setFont('Roboto');
    }
  }, [theme]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Theme name is required');
      return;
    }

    onSave({
      name: name.trim(),
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        background: backgroundColor,
        text: textColor
      },
      font
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {theme ? 'Edit Theme' : 'Create New Theme'}
      </Typography>

      <Stack spacing={3}>
        <TextField
          label="Theme Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
        />

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Colors</Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ minWidth: 100 }}>Primary:</Typography>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ width: 60, height: 40, cursor: 'pointer', border: '1px solid #ccc' }}
              />
              <TextField
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                size="small"
                sx={{ width: 120 }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ minWidth: 100 }}>Secondary:</Typography>
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                style={{ width: 60, height: 40, cursor: 'pointer', border: '1px solid #ccc' }}
              />
              <TextField
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                size="small"
                sx={{ width: 120 }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ minWidth: 100 }}>Background:</Typography>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{ width: 60, height: 40, cursor: 'pointer', border: '1px solid #ccc' }}
              />
              <TextField
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                size="small"
                sx={{ width: 120 }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ minWidth: 100 }}>Text:</Typography>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ width: 60, height: 40, cursor: 'pointer', border: '1px solid #ccc' }}
              />
              <TextField
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                size="small"
                sx={{ width: 120 }}
              />
            </Box>
          </Stack>
        </Box>

        <FormControl fullWidth>
          <InputLabel>Font</InputLabel>
          <Select
            value={font}
            label="Font"
            onChange={(e) => setFont(e.target.value)}
          >
            {webSafeFonts.map((fontName) => (
              <MenuItem key={fontName} value={fontName} sx={{ fontFamily: fontName }}>
                {fontName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Paper 
          sx={{ 
            p: 3, 
            backgroundColor: backgroundColor,
            color: textColor,
            fontFamily: font
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontFamily: font }}>
            Live Preview
          </Typography>
          <Typography sx={{ mb: 2, fontFamily: font }}>
            The quick brown fox jumps over the lazy dog
          </Typography>
          <Button 
            variant="contained" 
            sx={{ 
              backgroundColor: primaryColor,
              color: '#fff',
              fontFamily: font,
              '&:hover': {
                backgroundColor: secondaryColor
              }
            }}
          >
            Sample Button
          </Button>
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            Save Theme
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default ThemeEditor;