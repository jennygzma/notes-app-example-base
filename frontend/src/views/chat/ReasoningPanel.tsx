import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';

interface ReasoningPanelProps {
  reasoning: {
    folders_considered: number;
    folders_selected: number;
    notes_searched: number;
    notes_cited: number;
  };
}

const ReasoningPanel: React.FC<ReasoningPanelProps> = ({ reasoning }) => {
  return (
    <Box sx={{ 
      width: 300, 
      borderLeft: 1, 
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto'
    }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Search Details</Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" fontWeight="bold">
              Folder Selection
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  Considered: {reasoning.folders_considered} folders
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderIcon fontSize="small" color="primary" />
                <Typography variant="body2">
                  Selected: {reasoning.folders_selected} folders
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" fontWeight="bold">
              Search Results
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  Searched: {reasoning.notes_searched} notes
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon fontSize="small" color="success" />
                <Typography variant="body2">
                  Cited: {reasoning.notes_cited} notes
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Paper sx={{ p: 2, mt: 2, backgroundColor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            AI searched {reasoning.folders_selected} relevant {reasoning.folders_selected === 1 ? 'folder' : 'folders'} 
            and found {reasoning.notes_cited} {reasoning.notes_cited === 1 ? 'note' : 'notes'} to answer your question.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default ReasoningPanel;