import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Note, NoteVersion } from '../../types';
import Button from '../../components/design-system/Button';

interface VersionCompareViewProps {
  currentNote: Note;
  selectedVersion: NoteVersion;
  onSeeDiff: () => void;
  onRevert: () => void;
}

const VersionCompareView: React.FC<VersionCompareViewProps> = ({
  currentNote,
  selectedVersion,
  onSeeDiff,
  onRevert,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleRevert = () => {
    onRevert();
    setIsConfirming(false);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 2 }}>
        <Button onClick={onSeeDiff} variant="outlined">
          See Diff
        </Button>
        {isConfirming ? (
          <>
            <Button onClick={handleRevert} variant="contained" color="error">
              Confirm Revert
            </Button>
            <Button onClick={() => setIsConfirming(false)} variant="outlined">
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsConfirming(true)} variant="contained">
            Revert to This
          </Button>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
          <Box sx={{ flex: 1 }}>
            <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
              <Typography variant="overline" color="text.secondary" gutterBottom>
                Current Version
              </Typography>
              <Typography variant="h6" gutterBottom>
                {currentNote.title}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {currentNote.body}
              </Typography>
            </Paper>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Paper elevation={1} sx={{ p: 2, height: '100%', bgcolor: 'action.hover' }}>
              <Typography variant="overline" color="text.secondary" gutterBottom>
                Version {selectedVersion.version_number}
              </Typography>
              <Typography variant="h6" gutterBottom>
                {selectedVersion.title}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedVersion.body}
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default VersionCompareView;