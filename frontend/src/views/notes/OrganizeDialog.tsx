import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  CircularProgress,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import Button from '../../components/design-system/Button';

interface ProposedFolder {
  name: string;
  description?: string;
  color?: string;
  note_ids: string[];
}

interface ExistingFolderAssignment {
  folder_id: string;
  folder_name?: string;
  note_ids: string[];
}

interface OrganizeDialogProps {
  open: boolean;
  loading: boolean;
  preview: {
    total_notes: number;
    batches_processed: number;
    proposed_folders: ProposedFolder[];
    existing_folder_assignments: ExistingFolderAssignment[];
    message?: string;
  } | null;
  notes: any[];
  existingFolders: any[];
  onClose: () => void;
  onApply: (plan: {
    proposed_folders: ProposedFolder[];
    existing_folder_assignments: ExistingFolderAssignment[];
  }) => void;
}

const OrganizeDialog: React.FC<OrganizeDialogProps> = ({
  open,
  loading,
  preview,
  notes,
  existingFolders,
  onClose,
  onApply,
}) => {
  const [editedFolders, setEditedFolders] = useState<ProposedFolder[]>([]);
  const [editedAssignments, setEditedAssignments] = useState<ExistingFolderAssignment[]>([]);

  React.useEffect(() => {
    if (preview) {
      setEditedFolders(preview.proposed_folders || []);
      setEditedAssignments(
        (preview.existing_folder_assignments || []).map(assignment => ({
          ...assignment,
          folder_name: existingFolders.find(f => f.id === assignment.folder_id)?.name || 'Unknown'
        }))
      );
    }
  }, [preview, existingFolders]);

  const getNoteTitle = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    return note?.title || 'Untitled Note';
  };

  const handleFolderNameChange = (index: number, newName: string) => {
    const updated = [...editedFolders];
    updated[index] = { ...updated[index], name: newName };
    setEditedFolders(updated);
  };

  const handleFolderDescriptionChange = (index: number, newDescription: string) => {
    const updated = [...editedFolders];
    updated[index] = { ...updated[index], description: newDescription };
    setEditedFolders(updated);
  };

  const handleRemoveNoteFromFolder = (folderIndex: number, noteId: string) => {
    const updated = [...editedFolders];
    updated[folderIndex].note_ids = updated[folderIndex].note_ids.filter(id => id !== noteId);
    setEditedFolders(updated);
  };

  const handleRemoveNoteFromAssignment = (assignmentIndex: number, noteId: string) => {
    const updated = [...editedAssignments];
    updated[assignmentIndex].note_ids = updated[assignmentIndex].note_ids.filter(id => id !== noteId);
    setEditedAssignments(updated);
  };

  const handleApply = () => {
    const filteredFolders = editedFolders.filter(f => f.note_ids.length > 0);
    const filteredAssignments = editedAssignments.filter(a => a.note_ids.length > 0);
    
    onApply({
      proposed_folders: filteredFolders,
      existing_folder_assignments: filteredAssignments,
    });
  };

  const totalNotesToOrganize = 
    editedFolders.reduce((sum, f) => sum + f.note_ids.length, 0) +
    editedAssignments.reduce((sum, a) => sum + a.note_ids.length, 0);

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Analyzing your notes...</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            This may take a moment for large collections
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (!preview || preview.message) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Organization Complete</DialogTitle>
        <DialogContent>
          <Typography>{preview?.message || 'All notes are organized!'}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h6">AI-Suggested Organization</Typography>
          <Typography variant="caption" color="text.secondary">
            {preview.total_notes} notes analyzed • {preview.batches_processed} batch{preview.batches_processed > 1 ? 'es' : ''} processed
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Review and edit the suggestions below. You can rename folders, remove notes, or modify descriptions.
        </Typography>

        {editedFolders.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              New Folders ({editedFolders.length})
            </Typography>
            {editedFolders.map((folder, index) => (
              <Accordion key={index} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <FolderIcon sx={{ color: folder.color || '#808080' }} />
                    <Typography>{folder.name}</Typography>
                    <Chip label={`${folder.note_ids.length} notes`} size="small" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    label="Folder Name"
                    fullWidth
                    value={folder.name}
                    onChange={(e) => handleFolderNameChange(index, e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={2}
                    value={folder.description || ''}
                    onChange={(e) => handleFolderDescriptionChange(index, e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Notes to organize:
                  </Typography>
                  <List dense>
                    {folder.note_ids.map((noteId) => (
                      <ListItem 
                        key={noteId}
                        secondaryAction={
                          <Button 
                            size="small" 
                            onClick={() => handleRemoveNoteFromFolder(index, noteId)}
                          >
                            Remove
                          </Button>
                        }
                      >
                        <ListItemText primary={getNoteTitle(noteId)} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {editedAssignments.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Existing Folder Assignments ({editedAssignments.length})
            </Typography>
            {editedAssignments.map((assignment, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <FolderIcon />
                    <Typography>{assignment.folder_name}</Typography>
                    <Chip label={`${assignment.note_ids.length} notes`} size="small" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {assignment.note_ids.map((noteId) => (
                      <ListItem 
                        key={noteId}
                        secondaryAction={
                          <Button 
                            size="small" 
                            onClick={() => handleRemoveNoteFromAssignment(index, noteId)}
                          >
                            Remove
                          </Button>
                        }
                      >
                        <ListItemText primary={getNoteTitle(noteId)} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {totalNotesToOrganize} notes will be organized
          </Typography>
        </Box>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleApply} 
          variant="contained"
          disabled={totalNotesToOrganize === 0}
        >
          Apply Organization
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizeDialog;