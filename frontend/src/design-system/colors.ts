export const defaultColors = {
  primary: '#1976d2',
  secondary: '#dc004e',
  background: '#ffffff',
  text: '#000000',
};

export const webSafeFonts = [
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
] as const;

export type WebSafeFont = typeof webSafeFonts[number];