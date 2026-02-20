import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

interface ChatThinkingProps {
  thinking: {
    step1_reasoning: string;
    selected_folders: Array<{ id: string; name: string }>;
    step2_reasoning: string;
    examined_notes: Array<{ id: string; title: string }>;
  };
  onNoteClick: (noteId: string) => void;
}

const ChatThinking: React.FC<ChatThinkingProps> = ({ thinking, onNoteClick }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{ mt: 1, bgcolor: 'grey.50' }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          AI Thinking Process
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            Step 1: Folder Selection
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {thinking.step1_reasoning}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {thinking.selected_folders.map((folder) => (
              <Chip
                key={folder.id}
                icon={<FolderIcon />}
                label={folder.name}
                size="small"
                variant="outlined"
              />
            ))}
            {thinking.selected_folders.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                No specific folders selected
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 1 }} />

          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            Step 2: Note Analysis
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {thinking.step2_reasoning}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {thinking.examined_notes.map((note) => (
              <Chip
                key={note.id}
                icon={<DescriptionIcon />}
                label={note.title}
                size="small"
                variant="outlined"
                onClick={() => onNoteClick(note.id)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
            {thinking.examined_notes.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                No notes examined
              </Typography>
            )}
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ChatThinking;