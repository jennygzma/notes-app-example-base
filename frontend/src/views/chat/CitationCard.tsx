import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface CitationCardProps {
  citation: {
    note_id: string;
    title: string;
    excerpt: string;
  };
  onNavigateToNote?: (noteId: string) => void;
}

const CitationCard: React.FC<CitationCardProps> = ({ citation, onNavigateToNote }) => {
  const handleNavigate = () => {
    if (onNavigateToNote) {
      onNavigateToNote(citation.note_id);
    }
  };

  return (
    <Card sx={{ mb: 2, cursor: onNavigateToNote ? 'pointer' : 'default' }} onClick={handleNavigate}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              {citation.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {citation.excerpt}
            </Typography>
          </Box>
          {onNavigateToNote && (
            <IconButton size="small" onClick={handleNavigate}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CitationCard;