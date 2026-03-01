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
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Divider,
  useTheme,
} from '@mui/material';
import Button from '../../components/design-system/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import { SyncPreviewResponse, SyncResolution, SyncAction, SyncConflict } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  preview: SyncPreviewResponse | null;
  onExecute: (resolutions: SyncResolution[]) => void;
}

const SyncPreviewDialog: React.FC<Props> = ({ open, onClose, preview, onExecute }) => {
  const theme = useTheme();
  const [conflictResolutions, setConflictResolutions] = useState<{ [taskId: string]: 'use_local' | 'use_google' | 'skip' }>({});

  if (!preview) return null;

  const handleConflictResolutionChange = (taskId: string, resolution: 'use_local' | 'use_google' | 'skip') => {
    setConflictResolutions(prev => ({ ...prev, [taskId]: resolution }));
  };

  const handleExecute = () => {
    const resolutions: SyncResolution[] = preview.conflicts.map(conflict => ({
      task_id: conflict.task_id,
      resolution: conflictResolutions[conflict.task_id] || 'skip'
    }));
    onExecute(resolutions);
  };

  const createActions = preview.actions.filter(a => a.action === 'create');
  const updateActions = preview.actions.filter(a => a.action === 'update');
  const deleteActions = preview.actions.filter(a => a.action === 'delete');

  const getActionIcon = (action: string, source: string) => {
    if (action === 'create') return <AddIcon fontSize="small" />;
    if (action === 'update') return <EditIcon fontSize="small" />;
    if (action === 'delete') return <DeleteIcon fontSize="small" />;
    return null;
  };

  const getActionColor = (action: string) => {
    if (action === 'create') return theme.palette.success.main;
    if (action === 'update') return theme.palette.primary.main;
    if (action === 'delete') return theme.palette.error.main;
    return theme.palette.grey[500];
  };

  const renderActionItem = (action: SyncAction) => (
    <Box
      key={`${action.action}-${action.task.id}`}
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box sx={{ color: getActionColor(action.action) }}>
        {getActionIcon(action.action, action.source)}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={600}>
          {action.task.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {action.reason}
        </Typography>
      </Box>
      <Chip
        label={action.source === 'local' ? 'Local' : 'Google'}
        size="small"
        sx={{
          bgcolor: action.source === 'local' ? 'primary.50' : 'secondary.50',
          color: action.source === 'local' ? 'primary.main' : 'secondary.main',
        }}
      />
    </Box>
  );

  const renderConflictItem = (conflict: SyncConflict) => {
    const resolution = conflictResolutions[conflict.task_id] || 'skip';
    
    return (
      <Box
        key={conflict.task_id}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 1,
          bgcolor: 'warning.50',
          border: 1,
          borderColor: 'warning.main',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <WarningIcon color="warning" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>
            Conflict: {conflict.local_task.title}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: resolution === 'use_local' ? 'primary.main' : 'divider',
            }}
          >
            <Typography variant="caption" color="primary" fontWeight={600}>
              Local Version
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {conflict.local_task.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Updated: {new Date(conflict.local_updated_at).toLocaleString()}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: resolution === 'use_google' ? 'secondary.main' : 'divider',
            }}
          >
            <Typography variant="caption" color="secondary" fontWeight={600}>
              Google Version
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {conflict.google_task.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Updated: {new Date(conflict.google_updated_at).toLocaleString()}
            </Typography>
          </Box>
        </Box>

        <FormControl component="fieldset">
          <RadioGroup
            value={resolution}
            onChange={(e) => handleConflictResolutionChange(conflict.task_id, e.target.value as any)}
            row
          >
            <FormControlLabel value="use_local" control={<Radio size="small" />} label="Use Local" />
            <FormControlLabel value="use_google" control={<Radio size="small" />} label="Use Google" />
            <FormControlLabel value="skip" control={<Radio size="small" />} label="Skip" />
          </RadioGroup>
        </FormControl>
      </Box>
    );
  };

  const hasUnresolvedConflicts = preview.conflicts.some(
    conflict => !conflictResolutions[conflict.task_id] || conflictResolutions[conflict.task_id] === 'skip'
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Sync Preview</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Review the changes that will be synced between your local tasks and Google Tasks.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<AddIcon />}
              label={`${preview.summary.create_local + preview.summary.create_google} to create`}
              sx={{ bgcolor: 'success.50', color: 'success.main' }}
            />
            <Chip
              icon={<EditIcon />}
              label={`${preview.summary.update_local + preview.summary.update_google} to update`}
              sx={{ bgcolor: 'primary.50', color: 'primary.main' }}
            />
            <Chip
              icon={<DeleteIcon />}
              label={`${preview.summary.delete_local} to delete`}
              sx={{ bgcolor: 'error.50', color: 'error.main' }}
            />
            {preview.summary.conflicts > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${preview.summary.conflicts} conflicts`}
                sx={{ bgcolor: 'warning.50', color: 'warning.main' }}
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {preview.conflicts.length > 0 && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2" fontWeight={600}>
                Conflicts ({preview.conflicts.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {preview.conflicts.map(renderConflictItem)}
            </AccordionDetails>
          </Accordion>
        )}

        {createActions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2" fontWeight={600}>
                Create ({createActions.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {createActions.map(renderActionItem)}
            </AccordionDetails>
          </Accordion>
        )}

        {updateActions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2" fontWeight={600}>
                Update ({updateActions.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {updateActions.map(renderActionItem)}
            </AccordionDetails>
          </Accordion>
        )}

        {deleteActions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2" fontWeight={600}>
                Delete ({deleteActions.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {deleteActions.map(renderActionItem)}
            </AccordionDetails>
          </Accordion>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleExecute}
          variant="contained"
          disabled={preview.conflicts.length > 0 && hasUnresolvedConflicts}
        >
          Execute Sync
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SyncPreviewDialog;