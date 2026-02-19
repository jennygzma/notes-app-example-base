import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { OrganizeFoldersResponse, Note } from '../types';

interface OrganizeDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (result: OrganizeFoldersResponse) => Promise<void>;
  suggestions: OrganizeFoldersResponse | null;
  notes: Note[];
  loading: boolean;
}

const OrganizeDialog: React.FC<OrganizeDialogProps> = ({
  open,
  onClose,
  onApply,
  suggestions,
  notes,
  loading,
}) => {
  const [editedResult, setEditedResult] = useState<OrganizeFoldersResponse | null>(null);
  const [applying, setApplying] = useState(false);

  React.useEffect(() => {
    if (suggestions) {
      setEditedResult(JSON.parse(JSON.stringify(suggestions)));
    }
  }, [suggestions]);

  const handleAddFolder = (noteId: string, folderName: string) => {
    if (!editedResult) return;

    const updated = { ...editedResult };
    const assignment = updated.note_assignments.find(a => a.note_id === noteId);
    if (assignment && !assignment.folder_names.includes(folderName)) {
      assignment.folder_names.push(folderName);
      setEditedResult(updated);
    }
  };

  const handleRemoveFolder = (noteId: string, folderName: string) => {
    if (!editedResult) return;

    const updated = { ...editedResult };
    const assignment = updated.note_assignments.find(a => a.note_id === noteId);
    if (assignment) {
      assignment.folder_names = assignment.folder_names.filter(f => f !== folderName);
      setEditedResult(updated);
    }
  };

  const handleApply = async () => {
    if (!editedResult) return;

    setApplying(true);
    try {
      await onApply(editedResult);
      onClose();
    } catch (error) {
      console.error('Failed to apply organization:', error);
    } finally {
      setApplying(false);
    }
  };

  const getNoteTitle = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    return note?.title || 'Unknown Note';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>AI Folder Organization</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : editedResult ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              Suggested Folders
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {editedResult.suggested_folders.map((folder, index) => (
                <Chip
                  key={index}
                  label={folder.name}
                  sx={{
                    backgroundColor: folder.color || undefined,
                  }}
                />
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Note Assignments
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              You can add or remove folders for each note before applying
            </Typography>

            <List>
              {editedResult.note_assignments.map((assignment) => (
                <ListItem key={assignment.note_id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={getNoteTitle(assignment.note_id)}
                    secondary={
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {assignment.folder_names.map((folderName, idx) => (
                          <Chip
                            key={idx}
                            label={folderName}
                            size="small"
                            onDelete={() => handleRemoveFolder(assignment.note_id, folderName)}
                            deleteIcon={<DeleteIcon />}
                          />
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : (
          <Typography>No suggestions available</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={applying}>
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={!editedResult || applying}
        >
          {applying ? 'Applying...' : 'Apply Organization'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizeDialog;