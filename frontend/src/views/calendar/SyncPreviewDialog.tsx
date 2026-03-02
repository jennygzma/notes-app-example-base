import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '../../components/design-system/Button';
import Dialog from '../../components/shared/Dialog';
import { SyncPreviewResponse, SyncResolution } from '../../types';

interface SyncPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  preview: SyncPreviewResponse | null;
  onExecute: (resolutions: SyncResolution[]) => void;
}

const SyncPreviewDialog: React.FC<SyncPreviewDialogProps> = ({
  open,
  onClose,
  preview,
  onExecute,
}) => {
  const theme = useTheme();
  const [resolutions, setResolutions] = useState<{ [taskId: string]: 'use_local' | 'use_google' | 'skip' }>({});

  if (!preview) return null;

  const handleResolutionChange = (taskId: string, resolution: 'use_local' | 'use_google' | 'skip') => {
    setResolutions(prev => ({ ...prev, [taskId]: resolution }));
  };

  const handleExecute = () => {
    const resolutionList: SyncResolution[] = preview.conflicts.map(conflict => ({
      task_id: conflict.task_id,
      resolution: resolutions[conflict.task_id] || 'skip',
    }));
    onExecute(resolutionList);
  };

  const getActionColor = (action: string) => {
    if (action === 'create') return theme.palette.success.main;
    if (action === 'update') return theme.palette.secondary.main;
    if (action === 'delete') return theme.palette.error.main;
    return theme.palette.grey[500];
  };

  const createActions = preview.actions.filter(a => a.action === 'create');
  const updateActions = preview.actions.filter(a => a.action === 'update');
  const deleteActions = preview.actions.filter(a => a.action === 'delete');

  const allConflictsResolved = preview.conflicts.every(c => resolutions[c.task_id]);

  return (
    <Dialog open={open} onClose={onClose} title="Sync Preview" maxWidth="md" fullWidth>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {createActions.length > 0 && (
              <Chip
                label={`${createActions.length} to create`}
                sx={{ bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText }}
              />
            )}
            {updateActions.length > 0 && (
              <Chip
                label={`${updateActions.length} to update`}
                sx={{ bgcolor: theme.palette.secondary.light, color: theme.palette.secondary.contrastText }}
              />
            )}
            {deleteActions.length > 0 && (
              <Chip
                label={`${deleteActions.length} to delete`}
                sx={{ bgcolor: theme.palette.error.light, color: theme.palette.error.contrastText }}
              />
            )}
            {preview.conflicts.length > 0 && (
              <Chip
                label={`${preview.conflicts.length} conflict${preview.conflicts.length > 1 ? 's' : ''}`}
                sx={{ bgcolor: theme.palette.warning.light, color: theme.palette.warning.contrastText }}
              />
            )}
          </Box>
        </Box>

        <Divider />

        {createActions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>Create ({createActions.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {createActions.map((action, idx) => (
                  <Box key={idx} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {action.task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.reason} (from {action.source})
                    </Typography>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {updateActions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>Update ({updateActions.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {updateActions.map((action, idx) => (
                  <Box key={idx} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {action.task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.reason} (from {action.source})
                    </Typography>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {deleteActions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>Delete ({deleteActions.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {deleteActions.map((action, idx) => (
                  <Box key={idx} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {action.task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.reason}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {preview.conflicts.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom color="warning.main">
              Conflicts Requiring Resolution
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {preview.conflicts.map((conflict) => (
                <Box key={conflict.task_id} sx={{ p: 2, border: 1, borderColor: 'warning.main', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Task: {conflict.local_task.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Local Version
                      </Typography>
                      <Typography variant="body2">
                        Status: {conflict.local_task.completed ? 'Completed' : 'Pending'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Updated: {new Date(conflict.local_updated_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Google Version
                      </Typography>
                      <Typography variant="body2">
                        Status: {conflict.google_task.completed ? 'Completed' : 'Pending'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Updated: {new Date(conflict.google_updated_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  <RadioGroup
                    value={resolutions[conflict.task_id] || ''}
                    onChange={(e) => handleResolutionChange(conflict.task_id, e.target.value as any)}
                  >
                    <FormControlLabel value="use_local" control={<Radio size="small" />} label="Use Local Version" />
                    <FormControlLabel value="use_google" control={<Radio size="small" />} label="Use Google Version" />
                    <FormControlLabel value="skip" control={<Radio size="small" />} label="Skip (Don't Sync)" />
                  </RadioGroup>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleExecute}
            variant="contained"
            disabled={preview.conflicts.length > 0 && !allConflictsResolved}
          >
            Execute Sync
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default SyncPreviewDialog;