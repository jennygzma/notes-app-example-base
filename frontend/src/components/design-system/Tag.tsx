import React from 'react';
import { Chip as MuiChip, ChipProps as MuiChipProps } from '@mui/material';

export interface TagProps extends MuiChipProps {}

const Tag: React.FC<TagProps> = ({ sx, onClick, ...props }) => {
  return (
    <MuiChip
      size="small"
      onClick={onClick}
      sx={{
        ...(onClick && { cursor: 'pointer' }),
        ...sx,
      }}
      {...props}
    />
  );
};

export default Tag;
