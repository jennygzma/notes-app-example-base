import React, { useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
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
          <Typography variant="caption" color="error" fontWeight="bold">
            {confirmText}
          </Typography>
        )}
        <IconButton size="small" onClick={handleConfirm} color="error">
          <CheckIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleCancel}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  return (
    <IconButton size="small" onClick={handleStart} color={color}>
      {icon}
    </IconButton>
  );
};

export default InlineConfirmButton;
