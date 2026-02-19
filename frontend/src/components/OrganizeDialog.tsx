import React, { useState } from 'react';
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
  TextField,
  Chip,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface SuggestedFolder {
  name: string;
  color?: string;
}

interface NoteAssignment {
  note_id: string;
  folder_names: string[];
}

interface OrganizeDialogProps {
  open: boolean;
  onClose: () => void;
  suggestedFolders: SuggestedFolder[];
  noteAssignments: NoteAssignment[];
  notes: Array<{ id: string; title: string }>;
  onApprove: (data: { suggested_folders: SuggestedFolder[]; note_assignments: NoteAssignment[] }) => void;
}

const OrganizeDialog: React.FC<OrganizeDialogProps> = ({
  open,
  onClose,
  suggestedFolders: initialFolders,
  noteAssignments: initialAssignments,
  notes,
  onApprove,
}) => {
  const [folders, setFolders] = useState<SuggestedFolder[]>(initialFolders);
  const [assignments, setAssignments] = useState<NoteAssignment[]>(initialAssignments);
  const [newFolderName, setNewFolderName] = useState('');

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders([...folders, { name: newFolderName.trim() }]);
    setNewFolderName('');
  };

  const handleRemoveFolder = (index: number) => {
    const folderName = folders[index].name;
    setFolders(folders.filter((_, i) => i !== index));
    setAssignments(
      assignments.map((assignment) => ({
        ...assignment,
        folder_names: assignment.folder_names.filter((name) => name !== folderName),
      }))
    );
  };

  const handleAddFolderToNote = (noteId: string, folderName: string) => {
    setAssignments(
      assignments.map((assignment) =>
        assignment.note_id === noteId
          ? {
              ...assignment,
              folder_names: [...assignment.folder_names, folderName],
            }
          : assignment
      )
    );
  };

  const handleRemoveFolderFromNote = (noteId: string, folderName: string) => {
    setAssignments(
      assignments.map((assignment) =>
        assignment.note_id === noteId
          ? {
              ...assignment,
              folder_names: assignment.folder_names.filter((name) => name !== folderName),
            }
          : assignment
      )
    );
  };

  const handleApprove = () => {
    onApprove({
      suggested_folders: folders,
      note_assignments: assignments,
    });
  };

  const getNoteTitle = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    return note?.title || 'Untitled';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>AI Organization Preview</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Suggested Folders
          </Typography>
          <List>
            {folders.map((folder, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleRemoveFolder(index)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <Chip label={folder.name} sx={{ backgroundColor: folder.color || 'grey.300' }} />
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField
              size="small"
              placeholder="Add folder"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddFolder();
                }
              }}
            />
            <Button startIcon={<AddIcon />} onClick={handleAddFolder}>
              Add
            </Button>
          </Box>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            Note Assignments
          </Typography>
          <List>
            {assignments.map((assignment) => (
              <ListItem key={assignment.note_id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {getNoteTitle(assignment.note_id)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {assignment.folder_names.map((folderName) => (
                    <Chip
                      key={folderName}
                      label={folderName}
                      onDelete={() => handleRemoveFolderFromNote(assignment.note_id, folderName)}
                      size="small"
                    />
                  ))}
                  {folders
                    .filter((f) => !assignment.folder_names.includes(f.name))
                    .map((folder) => (
                      <Chip
                        key={folder.name}
                        label={`+ ${folder.name}`}
                        onClick={() => handleAddFolderToNote(assignment.note_id, folder.name)}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Reject</Button>
        <Button onClick={handleApprove} variant="contained">
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizeDialog;