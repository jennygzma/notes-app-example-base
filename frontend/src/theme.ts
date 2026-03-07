import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    versionHistory: string;
    diffHighlight: string;
  }
  interface PaletteOptions {
    versionHistory?: string;
    diffHighlight?: string;
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#009688',
    },
    secondary: {
      main: '#F06292',
    },
    error: {
      main: '#E53935',
    },
    versionHistory: '#E8D5FF',
    diffHighlight: '#FF9800',
  },
  typography: {
    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    h1: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1.125rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.01em' },
    subtitle1: { fontSize: '0.875rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.8rem', fontWeight: 500 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8rem' },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50, // Super rounded (Pill)
          padding: '6px 20px', // Petite padding
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem', // Petite font
        },
        input: {
          padding: '8px 12px', // Petite padding
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Slightly rounded for inputs, distinct from buttons
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Matches inputs
          height: 24, // Petite chips
        },
        label: {
          fontSize: '0.75rem',
          paddingLeft: 8,
          paddingRight: 8,
        },
      },
    },
  },
});

export default theme;
