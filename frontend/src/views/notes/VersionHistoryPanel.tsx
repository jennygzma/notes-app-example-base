import React, { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography, CircularProgress } from '@mui/material';
import { NoteVersion } from '../../types';
import { notesApi } from '../../services/api';

interface VersionHistoryPanelProps {
  noteId: string;
  onSelectVersion: (version: NoteVersion) => void;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ noteId, onSelectVersion }) => {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [noteId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await notesApi.getVersions(noteId);
      setVersions(data);
    } catch (error) {
      console.error('Failed to load versions:', error);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (versions.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No version history available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 280,
        minWidth: 280,
        maxWidth: 280,
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Version History</Typography>
      </Box>
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {versions.map((version) => (
          <ListItem key={version.id} disablePadding>
            <ListItemButton onClick={() => onSelectVersion(version)}>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Version {version.version_number}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(version.created_at)}
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default VersionHistoryPanel;