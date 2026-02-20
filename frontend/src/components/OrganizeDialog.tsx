import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { OrganizePreview, Note } from '../types';
import { foldersApi } from '../services/api';

interface OrganizeDialogProps {
  open: boolean;
  notes: Note[];
  onClose: () => void;
  onApproved: () => void;
}

const OrganizeDialog: React.FC<OrganizeDialogProps> = ({
  open,
  notes,
  onClose,
  onApproved,
}) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<OrganizePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedPreview, setEditedPreview] = useState<OrganizePreview | null>(null);

  useEffect(() => {
    if (open) {
      fetchPreview();
    } else {
      setPreview(null);
      setEditedPreview(null);
      setError(null);
    }
  }, [open]);

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await foldersApi.organizePreview();
      setPreview(response.data);
      setEditedPreview(JSON.parse(JSON.stringify(response.data)));
    } catch (err) {
      setError('Failed to generate organization preview. Please try again.');
      console.error('Failed to fetch organize preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!editedPreview) return;

    setLoading(true);
    try {
      await foldersApi.organizeApply(editedPreview);
      onApproved();
      onClose();
    } catch (err) {
      setError('Failed to apply organization. Please try again.');
      console.error('Failed to apply organization:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFolderFromNote = (noteId: string, folderName: string) => {
    if (!editedPreview) return;

    const updatedAssignments = editedPreview.note_assignments.map((assignment) => {
      if (assignment.note_id === noteId) {
        return {
          ...assignment,
          folder_names: assignment.folder_names.filter((name) => name !== folderName),
        };
      }
      return assignment;
    });

    setEditedPreview({
      ...editedPreview,
      note_assignments: updatedAssignments,
    });
  };

  const getNoteById = (noteId: string): Note | undefined => {
    return notes.find((note) => note.id === noteId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>AI Organization Preview</DialogTitle>
      <DialogContent>
        {loading && !preview && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {editedPreview && !loading && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Suggested Folders
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {editedPreview.suggested_folders.map((folder, index) => (
                <Chip
                  key={index}
                  label={folder.name}
                  sx={{
                    bgcolor: folder.color || '#87ae73',
                    color: 'white',
                  }}
                />
              ))}
              {editedPreview.suggested_folders.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No new folders suggested
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>
              Note Assignments
            </Typography>
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {editedPreview.note_assignments.map((assignment) => {
                const note = getNoteById(assignment.note_id);
                if (!note) return null;

                return (
                  <ListItem
                    key={assignment.note_id}
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {note.title || 'Untitled'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        mt: 0.5,
                      }}
                    >
                      {note.body}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {assignment.folder_names.map((folderName, idx) => (
                        <Chip
                          key={idx}
                          label={folderName}
                          size="small"
                          onDelete={() =>
                            handleRemoveFolderFromNote(assignment.note_id, folderName)
                          }
                        />
                      ))}
                      {assignment.folder_names.length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                          No folders assigned
                        </Typography>
                      )}
                    </Box>
                  </ListItem>
                );
              })}
            </List>

            {editedPreview.note_assignments.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No notes to organize
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {preview ? 'Reject' : 'Cancel'}
        </Button>
        <Button
          onClick={handleApprove}
          variant="contained"
          disabled={loading || !editedPreview}
        >
          {loading && preview ? 'Applying...' : 'Approve'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizeDialog;