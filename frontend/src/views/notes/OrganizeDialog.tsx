import React, { useState, useEffect } from 'react';
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
  TextField,
  IconButton,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Button from '../../components/design-system/Button';
import { Note } from '../../types';

interface OrganizeSuggestion {
  new_folders: Array<{
    name: string;
    description?: string;
    note_ids: string[];
  }>;
  existing_assignments: Array<{
    folder_id: string;
    note_ids: string[];
  }>;
  total_notes?: number;
  batches_processed?: number;
}

interface OrganizeDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (plan: OrganizeSuggestion) => void;
  suggestions: OrganizeSuggestion | null;
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
  const [editedSuggestions, setEditedSuggestions] = useState<OrganizeSuggestion | null>(null);
  const [editingFolderIndex, setEditingFolderIndex] = useState<number | null>(null);
  const [editedFolderName, setEditedFolderName] = useState('');
  const [editedFolderDescription, setEditedFolderDescription] = useState('');

  useEffect(() => {
    if (suggestions) {
      setEditedSuggestions(JSON.parse(JSON.stringify(suggestions)));
    }
  }, [suggestions]);

  const getNoteById = (noteId: string): Note | undefined => {
    return notes.find(n => n.id === noteId);
  };

  const handleRemoveNoteFromFolder = (folderIndex: number, noteId: string) => {
    if (!editedSuggestions) return;

    const updated = { ...editedSuggestions };
    updated.new_folders[folderIndex].note_ids = updated.new_folders[folderIndex].note_ids.filter(
      id => id !== noteId
    );

    if (updated.new_folders[folderIndex].note_ids.length === 0) {
      updated.new_folders.splice(folderIndex, 1);
    }

    setEditedSuggestions(updated);
  };

  const handleEditFolder = (folderIndex: number) => {
    if (!editedSuggestions) return;
    setEditingFolderIndex(folderIndex);
    setEditedFolderName(editedSuggestions.new_folders[folderIndex].name);
    setEditedFolderDescription(editedSuggestions.new_folders[folderIndex].description || '');
  };

  const handleSaveFolderEdit = () => {
    if (!editedSuggestions || editingFolderIndex === null) return;

    const updated = { ...editedSuggestions };
    updated.new_folders[editingFolderIndex].name = editedFolderName;
    updated.new_folders[editingFolderIndex].description = editedFolderDescription;

    setEditedSuggestions(updated);
    setEditingFolderIndex(null);
  };

  const handleApply = () => {
    if (editedSuggestions) {
      onApply(editedSuggestions);
    }
  };

  const totalNotes = editedSuggestions
    ? editedSuggestions.new_folders.reduce((sum, f) => sum + f.note_ids.length, 0) +
      editedSuggestions.existing_assignments.reduce((sum, a) => sum + a.note_ids.length, 0)
    : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Auto-Organize Notes</DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Analyzing unorganized notes...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {!loading && editedSuggestions && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              AI analyzed {editedSuggestions.total_notes || totalNotes} notes
              {editedSuggestions.batches_processed && ` in ${editedSuggestions.batches_processed} batches`}.
              Review and edit the suggestions below:
            </Typography>

            {editedSuggestions.new_folders.length === 0 && editedSuggestions.existing_assignments.length === 0 && (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                No organization suggestions available.
              </Typography>
            )}

            {editedSuggestions.new_folders.map((folder, folderIndex) => (
              <Accordion key={folderIndex} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      📁 {folder.name}
                    </Typography>
                    <Chip label={`${folder.note_ids.length} notes`} size="small" />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFolder(folderIndex);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {editingFolderIndex === folderIndex ? (
                    <Box>
                      <TextField
                        fullWidth
                        label="Folder Name"
                        value={editedFolderName}
                        onChange={(e) => setEditedFolderName(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Description (optional)"
                        value={editedFolderDescription}
                        onChange={(e) => setEditedFolderDescription(e.target.value)}
                        multiline
                        rows={2}
                        sx={{ mb: 2 }}
                      />
                      <Button onClick={handleSaveFolderEdit} variant="contained" size="small">
                        Save
                      </Button>
                    </Box>
                  ) : (
                    <>
                      {folder.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {folder.description}
                        </Typography>
                      )}
                      <List dense>
                        {folder.note_ids.map((noteId) => {
                          const note = getNoteById(noteId);
                          return (
                            <ListItem
                              key={noteId}
                              secondaryAction={
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => handleRemoveNoteFromFolder(folderIndex, noteId)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={note?.title || noteId}
                                secondary={note?.body.substring(0, 60) + '...'}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}

            {editedSuggestions.existing_assignments.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Existing Folder Assignments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {editedSuggestions.existing_assignments.reduce(
                    (sum, a) => sum + a.note_ids.length,
                    0
                  )}{' '}
                  notes will be added to existing folders.
                </Typography>
              </Box>
            )}
          </>
        )}

        {!loading && !editedSuggestions && (
          <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
            Click "Generate Suggestions" to start organizing your notes.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={loading || !editedSuggestions || totalNotes === 0}
        >
          Apply Organization
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizeDialog;