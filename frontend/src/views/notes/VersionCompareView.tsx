import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Note, NoteVersion } from '../../types';
import Button from '../../components/design-system/Button';

interface VersionCompareViewProps {
  currentNote: Note;
  selectedVersion: NoteVersion;
  onSeeDiff: () => void;
  onRevertFull: () => void;
}

const VersionCompareView: React.FC<VersionCompareViewProps> = ({
  currentNote,
  selectedVersion,
  onSeeDiff,
  onRevertFull,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Paper
        sx={{
          flex: 1,
          p: 3,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Current Version
        </Typography>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          {currentNote.title}
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {currentNote.body}
        </Typography>
      </Paper>

      <Paper
        sx={{
          flex: 1,
          p: 3,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Version {selectedVersion.version_number}
        </Typography>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          {selectedVersion.title}
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
          {selectedVersion.content}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
          <Button variant="outlined" onClick={onSeeDiff}>
            See Diff
          </Button>
          <Button variant="contained" onClick={onRevertFull}>
            Revert to This
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default VersionCompareView;