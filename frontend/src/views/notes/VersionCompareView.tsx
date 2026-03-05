import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Button from '../../components/design-system/Button';
import { Note, NoteVersion } from '../../types';
import InlineConfirmButton from '../../components/shared/InlineConfirmButton';

interface VersionCompareViewProps {
  currentNote: Note;
  version: NoteVersion;
  onSeeDiff: () => void;
  onRevert: () => void;
}

const VersionCompareView: React.FC<VersionCompareViewProps> = ({
  currentNote,
  version,
  onSeeDiff,
  onRevert,
}) => {
  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 0, gap: 2, p: 2, overflow: 'hidden' }}>
      <Paper sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>Current Version</Typography>
        <Typography variant="subtitle1" gutterBottom>{currentNote.title}</Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {currentNote.body}
        </Typography>
      </Paper>
      <Paper sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>Version {version.version_number}</Typography>
        <Typography variant="subtitle1" gutterBottom>{version.title}</Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {version.body}
        </Typography>
      </Paper>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
        <Button variant="outlined" onClick={onSeeDiff}>
          See Diff
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Revert to this
          </Typography>
          <InlineConfirmButton
            onConfirm={onRevert}
            confirmText="Revert?"
            icon={<Typography variant="caption">↩</Typography>}
            color="error"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default VersionCompareView;
