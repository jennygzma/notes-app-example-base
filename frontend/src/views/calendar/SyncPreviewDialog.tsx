import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '../../components/design-system/Button';
import { SyncPreviewResponse, SyncResolution, SyncAction, SyncConflict } from '../../types';
import { useTheme } from '@mui/material/styles';

interface Props {
  open: boolean;
  onClose: () => void;
  preview: SyncPreviewResponse | null;
  onExecute: (resolutions: SyncResolution[]) => void;
  loading?: boolean;
}

export const SyncPreviewDialog: React.FC<Props> = ({
  open,
  onClose,
  preview,
  onExecute,
  loading = false,
}) => {
  const theme = useTheme();
  const [resolutions, setResolutions] = useState<Map<string, 'use_local' | 'use_google' | 'skip'>>(new Map());

  if (!preview) {
    return null;
  }

  const handleResolutionChange = (taskId: string, resolution: 'use_local' | 'use_google' | 'skip') => {
    const newResolutions = new Map(resolutions);
    newResolutions.set(taskId, resolution);
    setResolutions(newResolutions);
  };

  const handleExecute = () => {
    const resolutionArray: SyncResolution[] = Array.from(resolutions.entries()).map(
      ([task_id, resolution]) => ({ task_id, resolution })
    );
    onExecute(resolutionArray);
  };

  const canExecute = preview.conflicts.length === 0 || preview.conflicts.every(c => resolutions.has(c.task_id));

  const createActions = preview.actions.filter(a => a.action === 'create');
  const updateActions = preview.actions.filter(a => a.action === 'update');
  const deleteActions = preview.actions.filter(a => a.action === 'delete');

  const ActionItem: React.FC<{ action: SyncAction }> = ({ action }) => (
    <ListItem sx={{ py: 1 }}>
      <ListItemText
        primary={action.task.title}
        secondary={action.reason}
        secondaryTypographyProps={{ variant: 'caption' }}
      />
      <Chip
        label={action.source === 'google' ? 'From Google' : 'To Google'}
        size="small"
        sx={{
          bgcolor: action.source === 'google' ? theme.palette.secondary.main : theme.palette.primary.main,
          color: '#fff',
        }}
      />
    </ListItem>
  );

  const ConflictItem: React.FC<{ conflict: SyncConflict }> = ({ conflict }) => {
    const resolution = resolutions.get(conflict.task_id);
    
    return (
      <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Task: {conflict.local_task.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Local
            </Typography>
            <Typography variant="body2">
              Updated: {new Date(conflict.local_updated_at).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              Completed: {conflict.local_task.completed ? 'Yes' : 'No'}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Google
            </Typography>
            <Typography variant="body2">
              Updated: {new Date(conflict.google_updated_at).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              Completed: {conflict.google_task.completed ? 'Yes' : 'No'}
            </Typography>
          </Box>
        </Box>
        <ToggleButtonGroup
          value={resolution || ''}
          exclusive
          onChange={(_, value) => value && handleResolutionChange(conflict.task_id, value)}
          size="small"
          fullWidth
        >
          <ToggleButton value="use_local">Use Local</ToggleButton>
          <ToggleButton value="use_google">Use Google</ToggleButton>
          <ToggleButton value="skip">Skip</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Sync Preview</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={`${createActions.length} to create`} color="primary" />
            <Chip label={`${updateActions.length} to update`} color="primary" />
            <Chip label={`${deleteActions.length} to delete`} sx={{ bgcolor: theme.palette.error.main, color: '#fff' }} />
            {preview.conflicts.length > 0 && (
              <Chip label={`${preview.conflicts.length} conflicts`} color="warning" />
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {createActions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Create ({createActions.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {createActions.map((action, idx) => (
                  <ActionItem key={idx} action={action} />
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {updateActions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Update ({updateActions.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {updateActions.map((action, idx) => (
                  <ActionItem key={idx} action={action} />
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {deleteActions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Delete ({deleteActions.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="warning" sx={{ mb: 2 }}>
                These tasks will be permanently deleted
              </Alert>
              <List dense>
                {deleteActions.map((action, idx) => (
                  <ActionItem key={idx} action={action} />
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {preview.conflicts.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom color="warning.main">
              Conflicts Require Resolution
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              These tasks have been modified in both locations. Choose which version to keep.
            </Alert>
            {preview.conflicts.map((conflict) => (
              <ConflictItem key={conflict.task_id} conflict={conflict} />
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleExecute}
          variant="contained"
          disabled={!canExecute || loading}
        >
          {loading ? 'Syncing...' : 'Execute Sync'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};