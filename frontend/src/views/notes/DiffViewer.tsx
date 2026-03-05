import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DiffChunk } from '../../types';
import { notesApi } from '../../services/api';
import Button from '../../components/design-system/Button';

interface DiffViewerProps {
  noteId: string;
  versionId: string;
  onRevert: (paragraphIndices: number[]) => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ noteId, versionId, onRevert }) => {
  const theme = useTheme();
  const [diffChunks, setDiffChunks] = useState<DiffChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadDiff();
  }, [noteId, versionId]);

  const loadDiff = async () => {
    setLoading(true);
    try {
      const data = await notesApi.getDiff(noteId, versionId);
      setDiffChunks(data);
    } catch (error) {
      console.error('Failed to load diff:', error);
      setDiffChunks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertParagraph = (paragraphIndex: number) => {
    onRevert([paragraphIndex]);
    setConfirmingIndex(null);
  };

  const getBackgroundColor = (type: string) => {
    if (type === 'unchanged') return 'transparent';
    return theme.palette.diffHighlight.main;
  };

  const getLabel = (type: string) => {
    if (type === 'added') return '(Added)';
    if (type === 'removed') return '(Removed)';
    return '';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (diffChunks.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No differences found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      {diffChunks.map((chunk, index) => (
        <Paper
          key={index}
          elevation={chunk.type === 'unchanged' ? 0 : 1}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: getBackgroundColor(chunk.type),
            border: chunk.type === 'unchanged' ? 'none' : '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Paragraph {chunk.paragraph_index + 1} {getLabel(chunk.type)}
            </Typography>
            {chunk.type !== 'unchanged' && (
              <Box>
                {confirmingIndex === index ? (
                  <>
                    <Button
                      onClick={() => handleRevertParagraph(chunk.paragraph_index)}
                      size="small"
                      variant="contained"
                      color="error"
                      sx={{ mr: 1 }}
                    >
                      Confirm
                    </Button>
                    <Button
                      onClick={() => setConfirmingIndex(null)}
                      size="small"
                      variant="outlined"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setConfirmingIndex(index)}
                    size="small"
                    variant="outlined"
                  >
                    Revert
                  </Button>
                )}
              </Box>
            )}
          </Box>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {chunk.content}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};

export default DiffViewer;