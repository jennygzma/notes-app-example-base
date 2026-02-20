import React from 'react';
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
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import { OrganizeResponse, Note } from '../types';

interface OrganizeDialogProps {
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
  suggestions: OrganizeResponse | null;
  loading: boolean;
  allNotes: Note[];
}

const OrganizeDialog: React.FC<OrganizeDialogProps> = ({
  open,
  onClose,
  onApproved,
  suggestions,
  loading,
  allNotes,
}) => {
  const getNoteById = (noteId: string) => {
    return allNotes.find(n => n.id === noteId);
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Organizing Notes with AI</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={60} />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Analyzing your notes and suggesting folders...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!suggestions) {
    return null;
  }

  if (suggestions.message || suggestions.assignments.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Organization Complete</DialogTitle>
        <DialogContent>
          <Typography>
            {suggestions.message || 'No unorganized notes found.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>AI Organization Preview</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Suggested Folders
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestions.suggested_folders.map((folder, index) => (
              <Chip
                key={index}
                icon={<FolderIcon />}
                label={folder.name}
                sx={{ 
                  bgcolor: folder.color || '#5BB9C2',
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            ))}
          </Box>
        </Box>

        <Typography variant="h6" gutterBottom>
          Note Assignments ({suggestions.assignments.length} notes)
        </Typography>
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {suggestions.assignments.map((assignment, index) => {
            const note = getNoteById(assignment.note_id);
            if (!note) return null;

            return (
              <ListItem
                key={index}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                  <DescriptionIcon sx={{ mr: 1 }} />
                  <Typography sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    {note.title || 'Untitled'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                  {assignment.folder_names.map((folderName, i) => (
                    <Chip
                      key={i}
                      label={folderName}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {assignment.reasoning}
                </Typography>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Reject</Button>
        <Button onClick={onApproved} variant="contained" color="primary">
          Apply Organization
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizeDialog;