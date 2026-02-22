import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ReasoningPanelProps {
  reasoning: {
    folders_considered: Array<{ id: string; name: string }>;
    folders_selected: Array<{ id: string; name: string }>;
    folder_selection_reasoning: string;
    notes_searched: number;
    notes_cited: number;
    confidence: string;
  };
}

const ReasoningPanel: React.FC<ReasoningPanelProps> = ({ reasoning }) => {
  const [expanded, setExpanded] = useState(true);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        AI Reasoning
      </Typography>

      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Folder Selection</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {reasoning.folder_selection_reasoning}
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Folders Considered ({reasoning.folders_considered.length})
          </Typography>
          <List dense>
            {reasoning.folders_considered.map((folder) => {
              const isSelected = reasoning.folders_selected.some((f) => f.id === folder.id);
              return (
                <ListItem
                  key={folder.id}
                  sx={{
                    bgcolor: isSelected ? 'action.selected' : 'transparent',
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  {isSelected && <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                  <ListItemText
                    primary={folder.name}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Notes Searched
          </Typography>
          <Chip label={reasoning.notes_searched} size="small" />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Notes Cited
          </Typography>
          <Chip label={reasoning.notes_cited} size="small" />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Confidence
          </Typography>
          <Chip
            label={reasoning.confidence.toUpperCase()}
            size="small"
            color={getConfidenceColor(reasoning.confidence) as any}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ReasoningPanel;