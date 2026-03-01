import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  RadioGroup,
  Radio,
  FormControlLabel,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import Button from '../../components/design-system/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import { SyncPreviewResponse, SyncResolution } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  preview: SyncPreviewResponse | null;
  onExecute: (resolutions: SyncResolution[]) => void;
}

const SyncPreviewDialog: React.FC<Props> = ({ open, onClose, preview, onExecute }) => {
  const [resolutions, setResolutions] = useState<{ [taskId: string]: string }>({});

  if (!preview) return null;

  const handleResolutionChange = (taskId: string, resolution: string) => {
    setResolutions(prev => ({ ...prev, [taskId]: resolution }));
  };

  const handleExecute = () => {
    const resolutionList: SyncResolution[] = preview.conflicts.map(conflict => ({
      task_id: conflict.task_id,
      resolution: (resolutions[conflict.task_id] || 'skip') as 'use_local' | 'use_google' | 'skip',
    }));
    onExecute(resolutionList);
  };

  const createActions = preview.actions.filter(a => a.action === 'create');
  const updateActions = preview.actions.filter(a => a.action === 'update');
  const deleteActions = preview.actions.filter(a => a.action === 'delete');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Sync Preview</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Summary</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`${preview.summary.create_local || 0} to import from Google`} color="success" size="small" />
            <Chip label={`${preview.summary.update_local || 0} to update from Google`} color="info" size="small" />
            <Chip label={`${preview.summary.create_google || 0} to push to Google`} color="success" size="small" />
            <Chip label={`${preview.summary.update_google || 0} to update in Google`} color="info" size="small" />
            <Chip label={`${preview.summary.delete_local || 0} to delete locally`} color="error" size="small" />
            <Chip label={`${preview.summary.conflicts || 0} conflicts`} color="warning" size="small" />
          </Box>
        </Box>

        {createActions.length > 0 && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddIcon color="success" />
                <Typography>Create ({createActions.length})</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {createActions.map((action, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{action.task.title}</TableCell>
                      <TableCell>
                        <Chip label={action.source} size="small" />
                      </TableCell>
                      <TableCell>{action.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        )}

        {updateActions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon color="info" />
                <Typography>Update ({updateActions.length})</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {updateActions.map((action, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{action.task.title}</TableCell>
                      <TableCell>
                        <Chip label={action.source} size="small" />
                      </TableCell>
                      <TableCell>{action.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        )}

        {deleteActions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DeleteIcon color="error" />
                <Typography>Delete ({deleteActions.length})</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="warning" sx={{ mb: 2 }}>
                These tasks will be permanently deleted
              </Alert>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deleteActions.map((action, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{action.task.title}</TableCell>
                      <TableCell>{action.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        )}

        {preview.conflicts.length > 0 && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                <Typography>Conflicts ({preview.conflicts.length})</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="warning" sx={{ mb: 2 }}>
                These tasks were changed both locally and in Google. Choose which version to keep.
              </Alert>
              {preview.conflicts.map((conflict) => (
                <Box key={conflict.task_id} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Task: {conflict.local_task.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Box sx={{ flex: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">Local Version</Typography>
                      <Typography variant="body2">{conflict.local_task.title}</Typography>
                      <Typography variant="caption">
                        {conflict.local_task.completed ? '✓ Completed' : '○ Pending'}
                      </Typography>
                      {conflict.local_task.due_date && (
                        <Typography variant="caption" display="block">
                          Due: {conflict.local_task.due_date}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ flex: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">Google Version</Typography>
                      <Typography variant="body2">{conflict.google_task.title}</Typography>
                      <Typography variant="caption">
                        {conflict.google_task.completed ? '✓ Completed' : '○ Pending'}
                      </Typography>
                      {conflict.google_task.due_date && (
                        <Typography variant="caption" display="block">
                          Due: {conflict.google_task.due_date}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <RadioGroup
                    value={resolutions[conflict.task_id] || 'skip'}
                    onChange={(e) => handleResolutionChange(conflict.task_id, e.target.value)}
                    sx={{ mt: 2 }}
                  >
                    <FormControlLabel value="use_local" control={<Radio />} label="Use Local Version" />
                    <FormControlLabel value="use_google" control={<Radio />} label="Use Google Version" />
                    <FormControlLabel value="skip" control={<Radio />} label="Skip (Don't Sync)" />
                  </RadioGroup>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleExecute} variant="contained" color="primary">
          Execute Sync
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SyncPreviewDialog;