import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import { Note, NoteVersion } from '../../types';

interface SearchResultsProps {
  results: {
    current_notes: Note[];
    version_history: NoteVersion[];
  };
  onSelectNote: (note: Note) => void;
  onSelectVersion: (noteId: string, versionId: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onSelectNote,
  onSelectVersion,
}) => {
  const theme = useTheme();

  const getSnippet = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {results.current_notes.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600 }}>
            Current Notes
          </Typography>
          <List>
            {results.current_notes.map((note) => (
              <ListItem key={note.id} disablePadding>
                <ListItemButton onClick={() => onSelectNote(note)}>
                  <ListItemText
                    primary={note.title}
                    secondary={getSnippet(note.body)}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {results.version_history.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600 }}>
            Version History
          </Typography>
          <List>
            {results.version_history.map((version) => (
              <ListItem key={version.version_id} disablePadding>
                <ListItemButton
                  onClick={() => onSelectVersion(version.note_id, version.version_id)}
                  sx={{
                    bgcolor: theme.palette.versionHistory?.main,
                    '&:hover': {
                      bgcolor: theme.palette.versionHistory?.main,
                      opacity: 0.8,
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{version.title}</span>
                        <Chip
                          label="Version History"
                          size="small"
                          sx={{
                            bgcolor: theme.palette.versionHistory?.contrastText,
                            color: '#fff',
                            fontSize: '0.7rem',
                            height: 20,
                          }}
                        />
                      </Box>
                    }
                    secondary={`v${version.version_number} • ${getSnippet(version.content)}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {results.current_notes.length === 0 && results.version_history.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No results found</Typography>
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;