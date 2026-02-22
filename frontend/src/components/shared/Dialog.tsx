import React from 'react';
import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps as MuiDialogProps,
} from '@mui/material';

export interface DialogProps extends Omit<MuiDialogProps, 'title' | 'content'> {
  title: React.ReactNode;
  actions?: React.ReactNode;
  content?: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ 
  title, 
  actions, 
  content, 
  children, 
  ...props 
}) => {
  return (
    <MuiDialog fullWidth maxWidth="sm" {...props}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {content || children}
      </DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </MuiDialog>
  );
};

export default Dialog;
