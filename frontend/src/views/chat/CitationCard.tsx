import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import Button from '../../components/design-system/Button';

interface Citation {
  note_id: string;
  note_title: string;
  excerpt: string;
  relevance: string;
}

interface CitationCardProps {
  citation: Citation;
  onOpenNote?: (noteId: string) => void;
}

const CitationCard: React.FC<CitationCardProps> = ({ citation, onOpenNote }) => {
  return (
    <Card 
      sx={{ 
        mb: 1, 
        cursor: onOpenNote ? 'pointer' : 'default',
        '&:hover': onOpenNote ? {
          boxShadow: 2,
        } : {},
      }}
      onClick={() => onOpenNote?.(citation.note_id)}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {citation.note_title}
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 1,
            fontStyle: 'italic',
            fontSize: '0.85rem'
          }}
        >
          "{citation.excerpt}"
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {citation.relevance}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CitationCard;