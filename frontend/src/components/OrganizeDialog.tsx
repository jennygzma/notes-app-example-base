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
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { OrganizeResponse, Note } from '../types';

interface OrganizeDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (data: OrganizeResponse) => void;
  suggestions: OrganizeResponse | null;
  loading: boolean;
  allNotes: Note[];
}

const OrganizeDialog: React.FC<OrganizeDialogProps> = ({
  open,
  onClose,
  onApply,
  suggestions,
  loading,
  allNotes,
}) => {
  const [editedSuggestions, setEditedSuggestions] = useState<OrganizeResponse | null>(null);

  React.useEffect(() => {
    if (suggestions) {
      setEditedSuggestions(suggestions);
    }
  }, [suggestions]);

  const handleApply = () => {
    if (editedSuggestions) {
      onApply(editedSuggestions);
      onClose();
    }
  };

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
              Analyzing your notes...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!editedSuggestions) {
    return null;
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
            {editedSuggestions.suggested_folders.map((folder, index) => (
              <Chip
                key={index}
                icon={<FolderIcon />}
                label={folder.name}
                sx={{ bgcolor: folder.color, color: 'white' }}
              />
            ))}
          </Box>
        </Box>

        <Typography variant="h6" gutterBottom>
          Note Assignments ({editedSuggestions.assignments.length} notes)
        </Typography>
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {editedSuggestions.assignments.map((assignment, index) => {
            const note = getNoteById(assignment.note_id);
            if (!note) return null;

            return (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <DescriptionIcon sx={{ mr: 1 }} />
                    <Typography sx={{ flexGrow: 1 }}>
                      {note.title || 'Untitled'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
                      {assignment.folder_names.map((folderName, i) => (
                        <Chip
                          key={i}
                          label={folderName}
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Note preview:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {note.body.substring(0, 150)}
                      {note.body.length > 150 ? '...' : ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>AI Reasoning:</strong> {assignment.reasoning}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </List>

        {editedSuggestions.message && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {editedSuggestions.message}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={editedSuggestions.assignments.length === 0}
        >
          Apply Organization
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizeDialog;