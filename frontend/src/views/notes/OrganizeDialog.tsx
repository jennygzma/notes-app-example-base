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
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import Dialog from '../../components/shared/Dialog';

interface OrganizeDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (plan: any) => void;
  preview: any;
  loading: boolean;
}

const OrganizeDialog: React.FC<OrganizeDialogProps> = ({
  open,
  onClose,
  onApply,
  preview,
  loading,
}) => {
  const [editedPlan, setEditedPlan] = useState<any>(null);
  const [editingFolder, setEditingFolder] = useState<{ index: number; folder: any } | null>(null);

  React.useEffect(() => {
    if (preview) {
      setEditedPlan(JSON.parse(JSON.stringify(preview)));
    }
  }, [preview]);

  const handleRemoveNote = (folderName: string, noteId: string) => {
    if (!editedPlan) return;
    
    const updatedAssignments = editedPlan.assignments.filter(
      (a: any) => !(a.folder_name === folderName && a.note_id === noteId)
    );
    
    setEditedPlan({ ...editedPlan, assignments: updatedAssignments });
  };

  const handleEditFolder = (index: number) => {
    setEditingFolder({
      index,
      folder: { ...editedPlan.new_folders[index] },
    });
  };

  const handleSaveFolder = () => {
    if (!editingFolder || !editedPlan) return;
    
    const updatedFolders = [...editedPlan.new_folders];
    const oldName = editedPlan.new_folders[editingFolder.index].name;
    updatedFolders[editingFolder.index] = editingFolder.folder;
    
    const updatedAssignments = editedPlan.assignments.map((a: any) => 
      a.folder_name === oldName 
        ? { ...a, folder_name: editingFolder.folder.name }
        : a
    );
    
    setEditedPlan({
      ...editedPlan,
      new_folders: updatedFolders,
      assignments: updatedAssignments,
    });
    setEditingFolder(null);
  };

  const handleApply = () => {
    if (editedPlan) {
      onApply(editedPlan);
    }
  };

  const getNotesByFolder = (folderName: string) => {
    if (!editedPlan) return [];
    return editedPlan.assignments.filter((a: any) => a.folder_name === folderName);
  };

  if (!editedPlan) {
    return null;
  }

  if (editedPlan.message) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Auto-Organize Notes"
        actions={
          <Button onClick={onClose}>Close</Button>
        }
      >
        <Typography>{editedPlan.message}</Typography>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Auto-Organize Preview"
        maxWidth="md"
        fullWidth
        actions={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleApply}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Apply Organization'}
            </Button>
          </>
        }
      >
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            AI suggests organizing {editedPlan.assignments.length} notes into{' '}
            {editedPlan.new_folders.length} folders. Review and edit before applying.
          </Typography>

          <Box sx={{ mt: 3 }}>
            {editedPlan.new_folders.map((folder: any, index: number) => {
              const notes = getNotesByFolder(folder.name);
              
              return (
                <Accordion key={index} defaultExpanded={index === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: folder.color,
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ flex: 1 }}>
                        {folder.name}
                      </Typography>
                      <Chip label={notes.length} size="small" />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFolder(index);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      {folder.description}
                    </Typography>
                    <List dense>
                      {notes.map((assignment: any) => (
                        <ListItem
                          key={assignment.note_id}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleRemoveNote(folder.name, assignment.note_id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={assignment.note_id}
                            secondary={assignment.reasoning}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </Box>
      </Dialog>

      {editingFolder && (
        <Dialog
          open={true}
          onClose={() => setEditingFolder(null)}
          title="Edit Folder"
          actions={
            <>
              <Button onClick={() => setEditingFolder(null)}>Cancel</Button>
              <Button onClick={handleSaveFolder} variant="contained">
                Save
              </Button>
            </>
          }
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              value={editingFolder.folder.name}
              onChange={(e) =>
                setEditingFolder({
                  ...editingFolder,
                  folder: { ...editingFolder.folder, name: e.target.value },
                })
              }
              fullWidth
            />
            <TextField
              label="Description"
              value={editingFolder.folder.description || ''}
              onChange={(e) =>
                setEditingFolder({
                  ...editingFolder,
                  folder: { ...editingFolder.folder, description: e.target.value },
                })
              }
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </Dialog>
      )}
    </>
  );
};

export default OrganizeDialog;