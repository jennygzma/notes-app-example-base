import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  IconButton,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import { NoteVersion } from '../../types';

interface VersionHistoryPanelProps {
  versions: NoteVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  onClose: () => void;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  versions,
  selectedVersionId,
  onSelectVersion,
  onClose,
}) => {
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box
      sx={{
        width: 280,
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon fontSize="small" />
          <Typography variant="h6">Version History</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {versions.map((version, index) => {
          const isSelected = version.id === selectedVersionId;
          const isCurrent = index === 0;

          return (
            <ListItem key={version.id} disablePadding>
              <ListItemButton
                onClick={() => onSelectVersion(version.id)}
                selected={isSelected}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  ...(isSelected && {
                    bgcolor: theme.palette.action.selected,
                  }),
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Version {version.version_number}
                    </Typography>
                    {isCurrent && (
                      <Typography
                        variant="caption"
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          color: 'white',
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: '0.65rem',
                        }}
                      >
                        Current
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(version.created_at)}
                  </Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default VersionHistoryPanel;