import React from 'react';
import { useTheme } from '@mui/material/styles';
import Tag from './Tag';

interface VersionChipProps {
  label: string;
}

const VersionChip: React.FC<VersionChipProps> = ({ label }) => {
  const theme = useTheme();

  return (
    <Tag
      label={label}
      sx={{
        bgcolor: theme.palette.versionHistory.main,
        color: theme.palette.versionHistory.contrastText,
        height: 20,
        fontSize: '0.7rem',
      }}
    />
  );
};

export default VersionChip;
