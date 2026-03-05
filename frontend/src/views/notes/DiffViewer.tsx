import React, { useState } from 'react';
import { Box, Typography, Paper, IconButton, useTheme } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Button from '../../components/design-system/Button';
import { DiffChunk } from '../../types';

interface DiffViewerProps {
  chunks: DiffChunk[];
  onRevertChunk: (index: number) => void;
  onClose: () => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ chunks, onRevertChunk, onClose }) => {
  const theme = useTheme();
  const [revertingIndices, setRevertingIndices] = useState<Set<number>>(new Set());

  const handleRevert = async (index: number) => {
    setRevertingIndices((prev) => new Set(prev).add(index));
    await onRevertChunk(index);
    setRevertingIndices((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const getChunkStyle = (type: string) => {
    if (type === 'add') {
      return {
        bgcolor: theme.palette.diffHighlight + '20',
        borderLeft: `3px solid ${theme.palette.diffHighlight}`,
      };
    } else if (type === 'remove') {
      return {
        bgcolor: theme.palette.error.main + '15',
        borderLeft: `3px solid ${theme.palette.error.main}`,
      };
    }
    return {
      borderLeft: '3px solid transparent',
    };
  };

  const getChunkIcon = (type: string) => {
    if (type === 'add') return <AddIcon fontSize="small" sx={{ color: theme.palette.diffHighlight }} />;
    if (type === 'remove') return <RemoveIcon fontSize="small" sx={{ color: theme.palette.error.main }} />;
    return null;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Difference View
        </Typography>
        <Button size="small" onClick={onClose}>
          Close
        </Button>
      </Box>

      <Paper
        elevation={1}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
        }}
      >
        {chunks.map((chunk, idx) => (
          <Box
            key={idx}
            sx={{
              ...getChunkStyle(chunk.type),
              p: 2,
              mb: 2,
              borderRadius: 1,
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              {getChunkIcon(chunk.type)}
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {chunk.content}
              </Typography>
              {chunk.type !== 'unchanged' && (
                <IconButton
                  size="small"
                  onClick={() => handleRevert(chunk.index)}
                  disabled={revertingIndices.has(chunk.index)}
                  sx={{
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  title="Revert this change"
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
        ))}
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Click the undo button to revert individual paragraphs
        </Typography>
      </Box>
    </Box>
  );
};

export default DiffViewer;