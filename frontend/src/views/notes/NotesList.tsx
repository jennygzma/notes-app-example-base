import React from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Note } from '../../types';
import Tag from '../../components/design-system/Tag';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  searchQuery: string;
}

const NotesList: React.FC<NotesListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  searchQuery,
}) => {
  const getPreview = (body: string): string => {
    const firstLine = body.split('\n')[0].trim();
    return firstLine || 'No content';
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const NoteRow: React.FC<{ note: Note }> = ({ note }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: `note:${note.id}`,
    });

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <ListItemButton
        ref={setNodeRef}
        style={style}
        selected={selectedNoteId === note.id}
        onClick={() => onSelectNote(note)}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '&.Mui-selected': {
            backgroundColor: 'action.selected',
            '&:hover': {
              backgroundColor: 'action.selected',
            },
          },
        }}
      >
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {note.title}
              </Typography>
              {note.is_inspiration && (
                <Tag 
                  icon={<LightbulbIcon />}
                  label="Inspiration"
                  color="primary"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
              {note.is_analyzed && !note.is_inspiration && (
                <Tag 
                  label="Task"
                  color="success"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
              <Box
                sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}
                {...listeners}
                {...attributes}
              >
                <DragIndicatorIcon fontSize="small" />
              </Box>
            </Box>
          }
          secondary={
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getPreview(note.body)}
            </Typography>
          }
        />
      </ListItemButton>
    );
  };

  return (
    <Box sx={{ 
      width: 300, 
      borderRight: 1, 
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    }}>
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {filteredNotes.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </Typography>
          </Box>
        ) : (
          filteredNotes.map((note) => (
            <NoteRow key={note.id} note={note} />
          ))
        )}
      </List>
    </Box>
  );
};

export default NotesList;
