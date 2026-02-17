import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  CircularProgress,
  Chip,
  Typography,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Note, PlannerItem } from '../types';

interface NoteDetailProps {
  note: Note | null;
  onUpdate: (id: string, title: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCategorize: (noteId: string) => Promise<void>;
  onConvertToTask: (noteId: string) => Promise<void>;
  linkedItems: PlannerItem[];
  onNavigateToItem: (item: PlannerItem) => void;
  inspirationCategory?: string | null;
  onNavigateToInspiration?: (category: string) => void;
  categorizingNoteId: string | null;
  translatingNoteId: string | null;
}

const NoteDetail: React.FC<NoteDetailProps> = ({
  note,
  onUpdate,
  onDelete,
  onCategorize,
  onConvertToTask,
  linkedItems,
  onNavigateToItem,
  inspirationCategory,
  onNavigateToInspiration,
  categorizingNoteId,
  translatingNoteId,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setHasChanges(false);
    }
  }, [note]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasChanges(true);
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (note && hasChanges) {
      await onUpdate(note.id, title, body);
      setHasChanges(false);
    }
  };

  const handleDelete = async () => {
    if (note && window.confirm('Delete this note?')) {
      await onDelete(note.id);
    }
  };

  const handleCategorize = async () => {
    if (note) {
      await onCategorize(note.id);
    }
  };

  const handleConvertToTask = async () => {
    if (note) {
      await onConvertToTask(note.id);
    }
  };

  if (!note) {
    return (
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography color="text.secondary">
          Select a note or create a new one
        </Typography>
      </Box>
    );
  }

  const isCategorizing = categorizingNoteId === note.id;
  const isTranslating = translatingNoteId === note.id;

  return (
    <Box sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh'
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={(isCategorizing || isTranslating) ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
          onClick={handleCategorize}
          disabled={isCategorizing || isTranslating}
        >
          AI
        </Button>
        {hasChanges && (
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
          >
            Save
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={handleDelete} color="error">
          <DeleteIcon />
        </IconButton>
      </Box>

      {(linkedItems.length > 0 || inspirationCategory) && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          {linkedItems.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Linked to:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: inspirationCategory ? 2 : 0 }}>
                {linkedItems.map((item) => (
                  <Chip
                    key={item.id}
                    label={item.title}
                    size="small"
                    onClick={() => onNavigateToItem(item)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            </>
          )}
          {inspirationCategory && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Category:
              </Typography>
              <Chip
                label={inspirationCategory}
                size="small"
                color="primary"
                onClick={() => onNavigateToInspiration?.(inspirationCategory)}
                sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
              />
            </>
          )}
        </Box>
      )}

      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <TextField
          fullWidth
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Title"
          variant="standard"
          sx={{ 
            mb: 2,
            '& .MuiInput-root': {
              fontSize: '1.5rem',
              fontWeight: 600,
            }
          }}
        />
        <TextField
          fullWidth
          multiline
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="Start typing..."
          variant="standard"
          sx={{
            '& .MuiInput-root': {
              fontSize: '1rem',
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default NoteDetail;
