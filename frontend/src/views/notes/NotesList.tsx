import React from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Note } from '../../types';
import TextField from '../../components/design-system/TextField';
import Tag from '../../components/design-system/Tag';

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface DraggableNoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (note: Note) => void;
  getPreview: (body: string) => string;
}

const DraggableNoteItem: React.FC<DraggableNoteItemProps> = ({ note, isSelected, onSelect, getPreview }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
    data: { note },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
  };

  return (
    <ListItemButton
      ref={setNodeRef}
      style={style}
      selected={isSelected}
      onClick={() => onSelect(note)}
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
      <IconButton
        size="small"
        {...attributes}
        {...listeners}
        sx={{ mr: 1, cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
        onClick={(e) => e.stopPropagation()}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
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

const NotesList: React.FC<NotesListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  searchQuery,
  onSearchChange,
}) => {
  const getPreview = (body: string): string => {
    const firstLine = body.split('\n')[0].trim();
    return firstLine || 'No content';
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ 
      width: 300, 
      borderRight: 1, 
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          size="small"
          placeholder="Search notes"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {filteredNotes.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </Typography>
          </Box>
        ) : (
          filteredNotes.map((note) => (
            <DraggableNoteItem
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onSelect={onSelectNote}
              getPreview={getPreview}
            />
          ))
        )}
      </List>
    </Box>
  );
};

export default NotesList;
