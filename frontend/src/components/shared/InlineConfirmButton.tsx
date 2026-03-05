import React, { useState } from 'react';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface InlineConfirmButtonProps {
  onConfirm: () => void;
  icon?: React.ReactNode;
  confirmText?: string;
  color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const InlineConfirmButton: React.FC<InlineConfirmButtonProps> = ({
  onConfirm,
  icon = <DeleteIcon fontSize="small" />,
  confirmText = 'Delete?',
  color = 'error',
}) => {
  const theme = useTheme();
  const isError = color === 'error';
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfirm();
    setIsConfirming(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(false);
  };

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(true);
  };

  if (isConfirming) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {confirmText && (
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ color: theme.palette.error.main }}
          >
            {confirmText}
          </Typography>
        )}
        <IconButton size="small" onClick={handleConfirm} sx={{ color: theme.palette.error.main }}>
          <CheckIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleCancel}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  return (
    <IconButton
      size="small"
      onClick={handleStart}
      color={isError ? 'default' : color}
      sx={isError ? { color: theme.palette.error.main } : undefined}
    >
      {icon}
    </IconButton>
  );
};

export default InlineConfirmButton;
