import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import Dialog from '../../components/shared/Dialog';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import { Note } from '../../types';

interface NewFolder {
  name: string;
  description: string;
  color: string;
  note_ids: string[];
}

interface ExistingAssignment {
  folder_id: string;
  note_ids: string[];
}

interface OrganizePlan {
  new_folders: NewFolder[];
  existing_assignments: ExistingAssignment[];
}

interface OrganizeDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (plan: OrganizePlan) => void;
  suggestions: OrganizePlan | null;
  loading: boolean;
  notes: Note[];
  folders: any[];
}

const OrganizeDialog: React.FC<OrganizeDialogProps> = ({
  open,
  onClose,
  onApply,
  suggestions,
  loading,
  notes,
  folders,
}) => {
  const [editedPlan, setEditedPlan] = useState<OrganizePlan | null>(null);

  React.useEffect(() => {
    if (suggestions) {
      setEditedPlan(JSON.parse(JSON.stringify(suggestions)));
    }
  }, [suggestions]);

  const getNoteById = (noteId: string) => {
    return notes.find(n => n.id === noteId);
  };

  const getFolderById = (folderId: string) => {
    return folders.find(f => f.id === folderId);
  };

  const handleRemoveNoteFromNewFolder = (folderIndex: number, noteId: string) => {
    if (!editedPlan) return;
    const updated = { ...editedPlan };
    updated.new_folders[folderIndex].note_ids = updated.new_folders[folderIndex].note_ids.filter(id => id !== noteId);
    setEditedPlan(updated);
  };

  const handleRemoveNoteFromExisting = (assignmentIndex: number, noteId: string) => {
    if (!editedPlan) return;
    const updated = { ...editedPlan };
    updated.existing_assignments[assignmentIndex].note_ids = updated.existing_assignments[assignmentIndex].note_ids.filter(id => id !== noteId);
    setEditedPlan(updated);
  };

  const handleUpdateFolderName = (folderIndex: number, name: string) => {
    if (!editedPlan) return;
    const updated = { ...editedPlan };
    updated.new_folders[folderIndex].name = name;
    setEditedPlan(updated);
  };

  const handleUpdateFolderDescription = (folderIndex: number, description: string) => {
    if (!editedPlan) return;
    const updated = { ...editedPlan };
    updated.new_folders[folderIndex].description = description;
    setEditedPlan(updated);
  };

  const handleApply = () => {
    if (editedPlan) {
      const cleanedPlan = {
        new_folders: editedPlan.new_folders.filter(f => f.note_ids.length > 0),
        existing_assignments: editedPlan.existing_assignments.filter(a => a.note_ids.length > 0),
      };
      onApply(cleanedPlan);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="AI-Suggested Organization"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply} variant="contained" disabled={loading || !editedPlan}>
            Apply Organization
          </Button>
        </>
      }
    >
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Analyzing notes...</Typography>
        </Box>
      )}

      {!loading && editedPlan && (
        <Box>
          {editedPlan.new_folders.length === 0 && editedPlan.existing_assignments.length === 0 && (
            <Typography color="text.secondary">No organization suggestions. All notes are already organized!</Typography>
          )}

          {editedPlan.new_folders.map((folder, folderIndex) => (
            <Accordion key={folderIndex} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <FolderIcon sx={{ color: folder.color }} />
                  <Typography fontWeight="bold">{folder.name}</Typography>
                  <Chip label={`${folder.note_ids.length} notes`} size="small" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  label="Folder Name"
                  value={folder.name}
                  onChange={(e) => handleUpdateFolderName(folderIndex, e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ mb: 1 }}
                />
                <TextField
                  label="Description"
                  value={folder.description}
                  onChange={(e) => handleUpdateFolderDescription(folderIndex, e.target.value)}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  Notes to be added:
                </Typography>
                <List dense>
                  {folder.note_ids.map((noteId) => {
                    const note = getNoteById(noteId);
                    return note ? (
                      <ListItem
                        key={noteId}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleRemoveNoteFromNewFolder(folderIndex, noteId)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={note.title}
                          secondary={note.body.substring(0, 60) + (note.body.length > 60 ? '...' : '')}
                        />
                      </ListItem>
                    ) : null;
                  })}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}

          {editedPlan.existing_assignments.map((assignment, assignmentIndex) => {
            const folder = getFolderById(assignment.folder_id);
            return folder ? (
              <Accordion key={assignmentIndex} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <FolderIcon sx={{ color: folder.color }} />
                    <Typography fontWeight="bold">{folder.name}</Typography>
                    <Chip label={`+${assignment.note_ids.length} notes`} size="small" color="primary" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Notes to be added to existing folder:
                  </Typography>
                  <List dense>
                    {assignment.note_ids.map((noteId) => {
                      const note = getNoteById(noteId);
                      return note ? (
                        <ListItem
                          key={noteId}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleRemoveNoteFromExisting(assignmentIndex, noteId)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={note.title}
                            secondary={note.body.substring(0, 60) + (note.body.length > 60 ? '...' : '')}
                          />
                        </ListItem>
                      ) : null;
                    })}
                  </List>
                </AccordionDetails>
              </Accordion>
            ) : null;
          })}
        </Box>
      )}
    </Dialog>
  );
};

export default OrganizeDialog;