import React from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InlineConfirmButton from '../../components/shared/InlineConfirmButton';
import { DiffChunk } from '../../types';

interface DiffViewerProps {
  diffs: DiffChunk[];
  onRevertParagraph: (paragraphIndex: number) => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ diffs, onRevertParagraph }) => {
  const theme = useTheme();
  const getBackgroundColor = (type: string) => {
    if (type === 'unchanged') return 'transparent';
    return theme.palette.diffHighlight.light ?? theme.palette.diffHighlight.main;
  };

  const getHighlightColor = (type: string) => {
    return type !== 'unchanged' ? theme.palette.diffHighlight.main : 'transparent';
  };

  return (
    <Box sx={{ p: 2, height: '100%', minHeight: 0, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Paragraph-by-Paragraph Diff
      </Typography>
      <Stack spacing={2}>
        {diffs.map((diff, index) => (
          <Paper
            key={index}
            sx={{
              p: 2,
              bgcolor: getBackgroundColor(diff.type),
              borderLeft: `4px solid ${getHighlightColor(diff.type)}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {diff.type === 'unchanged' ? 'Unchanged' : diff.type === 'added' ? 'Added' : 'Removed'}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  {diff.content}
                </Typography>
              </Box>
              {diff.type === 'removed' && (
                <Box sx={{ ml: 2 }}>
                  <InlineConfirmButton
                    onConfirm={() => onRevertParagraph(diff.paragraph_index)}
                    confirmText="Revert?"
                    icon={<Typography variant="caption">↩</Typography>}
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default DiffViewer;
