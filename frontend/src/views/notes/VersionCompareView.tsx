import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Button from '../../components/design-system/Button';
import { Note, NoteVersion } from '../../types';

interface VersionCompareViewProps {
  currentNote: Note;
  selectedVersion: NoteVersion;
  onShowDiff: () => void;
  onRevertFull: () => void;
}

const VersionCompareView: React.FC<VersionCompareViewProps> = ({
  currentNote,
  selectedVersion,
  onShowDiff,
  onRevertFull,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%', p: 2 }}>
      <Paper
        elevation={1}
        sx={{
          flex: 1,
          p: 2,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Current Version
        </Typography>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
          {currentNote.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            flex: 1,
          }}
        >
          {currentNote.body}
        </Typography>
      </Paper>

      <Paper
        elevation={1}
        sx={{
          flex: 1,
          p: 2,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Version {selectedVersion.version_number}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" onClick={onShowDiff}>
              See Diff
            </Button>
            <Button size="small" variant="contained" onClick={onRevertFull}>
              Revert to This
            </Button>
          </Box>
        </Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          {selectedVersion.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            flex: 1,
          }}
        >
          {selectedVersion.body}
        </Typography>
      </Paper>
    </Box>
  );
};

export default VersionCompareView;