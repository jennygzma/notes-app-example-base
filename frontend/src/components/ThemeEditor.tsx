import React from 'react';
import { Box, TextField, Button, Stack, MenuItem, Typography, Paper, Card, CardContent } from '@mui/material';

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

interface ThemeEditorProps {
  draftTheme: Theme;
  mode: 'create' | 'edit';
  onChange: (theme: Theme) => void;
  onSave: (theme: Theme) => void;
  onCancel: () => void;
}

const FONTS = [
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

const ThemeEditor: React.FC<ThemeEditorProps> = ({
  draftTheme,
  mode,
  onChange,
  onSave,
  onCancel,
}) => {
  const handleColorChange = (colorKey: keyof Theme['colors'], value: string) => {
    onChange({
      ...draftTheme,
      colors: {
        ...draftTheme.colors,
        [colorKey]: value,
      },
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <TextField
        label="Theme Name"
        value={draftTheme.name}
        onChange={(e) => onChange({ ...draftTheme, name: e.target.value })}
        fullWidth
        margin="normal"
      />

      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
        Colors
      </Typography>
      
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption">Primary Color</Typography>
          <TextField
            type="color"
            value={draftTheme.colors.primary}
            onChange={(e) => handleColorChange('primary', e.target.value)}
            fullWidth
          />
        </Box>

        <Box>
          <Typography variant="caption">Secondary Color</Typography>
          <TextField
            type="color"
            value={draftTheme.colors.secondary}
            onChange={(e) => handleColorChange('secondary', e.target.value)}
            fullWidth
          />
        </Box>

        <Box>
          <Typography variant="caption">Background Color</Typography>
          <TextField
            type="color"
            value={draftTheme.colors.background}
            onChange={(e) => handleColorChange('background', e.target.value)}
            fullWidth
          />
        </Box>

        <Box>
          <Typography variant="caption">Text Color</Typography>
          <TextField
            type="color"
            value={draftTheme.colors.text}
            onChange={(e) => handleColorChange('text', e.target.value)}
            fullWidth
          />
        </Box>
      </Stack>

      <TextField
        select
        label="Font"
        value={draftTheme.font}
        onChange={(e) => onChange({ ...draftTheme, font: e.target.value })}
        fullWidth
        margin="normal"
        sx={{ mt: 3 }}
      >
        {FONTS.map((font) => (
          <MenuItem key={font} value={font} sx={{ fontFamily: font }}>
            {font}
          </MenuItem>
        ))}
      </TextField>

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
        Live Preview
      </Typography>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          backgroundColor: draftTheme.colors.background,
          color: draftTheme.colors.text,
          fontFamily: draftTheme.font,
        }}
      >
        <Typography sx={{ mb: 2, fontFamily: draftTheme.font }}>
          The quick brown fox jumps over the lazy dog
        </Typography>
        
        <Button
          variant="contained"
          sx={{
            backgroundColor: draftTheme.colors.primary,
            color: '#fff',
            mb: 2,
            '&:hover': {
              backgroundColor: draftTheme.colors.primary,
              opacity: 0.9,
            },
          }}
        >
          Sample Button
        </Button>

        <Card sx={{ backgroundColor: draftTheme.colors.background }}>
          <CardContent>
            <Typography sx={{ color: draftTheme.colors.text, fontFamily: draftTheme.font }}>
              Sample Card Content
            </Typography>
          </CardContent>
        </Card>
      </Paper>
      
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button onClick={() => onSave(draftTheme)} variant="contained">
          Save Theme
        </Button>
        <Button onClick={onCancel} variant="outlined">
          Cancel
        </Button>
      </Stack>
    </Box>
  );
};

export default ThemeEditor;