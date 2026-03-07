import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography, Divider } from '@mui/material';
import { NoteVersion } from '../../types';

interface VersionHistoryPanelProps {
  versions: NoteVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (version: NoteVersion) => void;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  versions,
  selectedVersionId,
  onSelectVersion,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ width: 300, height: '100%', minHeight: 0, borderLeft: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6">Version History</Typography>
      </Box>
      <List>
        {versions.map((version, index) => (
          <React.Fragment key={version.id}>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedVersionId === version.id}
                onClick={() => onSelectVersion(version)}
              >
                <ListItemText
                  primary={`Version ${version.version_number}`}
                  secondary={formatDate(version.created_at)}
                />
              </ListItemButton>
            </ListItem>
            {index < versions.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default VersionHistoryPanel;
