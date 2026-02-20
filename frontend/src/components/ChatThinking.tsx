import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';

interface ChatThinkingProps {
  thinking: {
    step1_reasoning: string;
    selected_folders: Array<{id: string; name: string}>;
    step2_reasoning: string;
    examined_notes: Array<{id: string; title: string}>;
  };
  onNoteClick: (noteId: string) => void;
}

const ChatThinking: React.FC<ChatThinkingProps> = ({ thinking, onNoteClick }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{ bgcolor: 'background.default' }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="caption" color="text.secondary">
          View AI Thinking Process
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Step 1: Folder Selection
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {thinking.step1_reasoning}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {thinking.selected_folders.map((folder) => (
              <Chip
                key={folder.id}
                icon={<FolderIcon />}
                label={folder.name}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Step 2: Note Examination
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {thinking.step2_reasoning}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {thinking.examined_notes.map((note) => (
              <Chip
                key={note.id}
                icon={<DescriptionIcon />}
                label={note.title}
                size="small"
                onClick={() => onNoteClick(note.id)}
                clickable
              />
            ))}
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ChatThinking;