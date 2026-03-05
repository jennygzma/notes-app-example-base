import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { SearchResult, Note } from '../../types';

interface SearchResultsProps {
  results: SearchResult[];
  onSelectResult: (note: Note, versionId?: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelectResult }) => {
  const theme = useTheme();

  if (results.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No results found</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {results.map((result, index) => (
        <ListItem key={`${result.note.id}-${result.version?.id || index}`} disablePadding>
          <ListItemButton
            onClick={() => onSelectResult(result.note, result.version?.id)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              py: 2,
              px: 2,
              borderBottom: 1,
              borderColor: 'divider',
              ...(result.is_version_history && {
                bgcolor: theme.palette.versionHistory + '20',
              }),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                {result.note.title}
              </Typography>
              {result.is_version_history && (
                <Chip
                  icon={<HistoryIcon sx={{ fontSize: 14 }} />}
                  label={`v${result.version?.version_number}`}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.versionHistory,
                    height: 20,
                    fontSize: '0.7rem',
                  }}
                />
              )}
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {result.match_snippet || result.note.body}
            </Typography>
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default SearchResults;