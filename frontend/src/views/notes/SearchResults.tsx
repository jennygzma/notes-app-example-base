import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { SearchResult } from '../../types';
import VersionChip from '../../components/design-system/VersionChip';

interface SearchResultsProps {
  results: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelectResult }) => {
  if (results.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">No results found</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%' }}>
      {results.map((result) => (
        <ListItem key={result.id} disablePadding>
          <ListItemButton onClick={() => onSelectResult(result)}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">{result.title}</Typography>
                  {result.is_version_history && (
                    <VersionChip label={`v${result.version_number}`} />
                  )}
                </Box>
              }
              secondary={
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {result.snippet}
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default SearchResults;
