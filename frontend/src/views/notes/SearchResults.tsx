import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Chip, Typography } from '@mui/material';
import { SearchResult } from '../../types';
import { useTheme } from '@mui/material/styles';

interface SearchResultsProps {
  results: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelectResult }) => {
  const theme = useTheme();

  if (results.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No results found
        </Typography>
      </Box>
    );
  }

  const getSnippet = (body: string, maxLength: number = 150): string => {
    if (body.length <= maxLength) return body;
    return body.substring(0, maxLength) + '...';
  };

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
                    <Chip
                      label={`v${result.version_number}`}
                      size="small"
                      sx={{
                        backgroundColor: theme.palette.versionHistory.main,
                        color: theme.palette.text.primary,
                      }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {getSnippet(result.body)}
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