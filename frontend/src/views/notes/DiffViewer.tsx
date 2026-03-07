import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { DiffChunk } from '../../types';
import Button from '../../components/design-system/Button';

interface DiffViewerProps {
  chunks: DiffChunk[];
  onRevertParagraph: (index: number) => void;
  onBack: () => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  chunks,
  onRevertParagraph,
  onBack,
}) => {
  const theme = useTheme();

  const getChunkColor = (type: string) => {
    switch (type) {
      case 'added':
        return { bgcolor: '#e8f5e9', label: 'Added' };
      case 'removed':
        return { bgcolor: '#ffebee', label: 'Removed' };
      case 'changed':
        return { bgcolor: theme.palette.diffHighlight?.main || '#FF9800', label: 'Changed' };
      default:
        return { bgcolor: 'transparent', label: 'Unchanged' };
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Button variant="outlined" size="small" onClick={onBack}>
          ← Back to Compare
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Paragraph-by-Paragraph Diff
        </Typography>

        {chunks.map((chunk, idx) => {
          const style = getChunkColor(chunk.type);
          const showRevert = chunk.type === 'changed' || chunk.type === 'removed';

          return (
            <Paper
              key={idx}
              sx={{
                p: 2,
                mb: 2,
                bgcolor: style.bgcolor,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Paragraph {idx + 1} - {style.label}
                </Typography>
                {showRevert && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onRevertParagraph(chunk.index)}
                  >
                    Revert This
                  </Button>
                )}
              </Box>

              {chunk.type === 'changed' && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Current:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {chunk.current}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Version:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {chunk.version}
                    </Typography>
                  </Box>
                </Box>
              )}

              {chunk.type === 'unchanged' && (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {chunk.current}
                </Typography>
              )}

              {chunk.type === 'added' && (
                <Box>
                  <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 0.5 }}>
                    + Added in current version
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {chunk.current}
                  </Typography>
                </Box>
              )}

              {chunk.type === 'removed' && (
                <Box>
                  <Typography variant="caption" color="error.main" sx={{ display: 'block', mb: 0.5 }}>
                    - Removed from version
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {chunk.version}
                  </Typography>
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default DiffViewer;