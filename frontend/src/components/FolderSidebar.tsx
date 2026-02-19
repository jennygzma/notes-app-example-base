import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
  IconButton,
  Divider,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import FolderOffIcon from '@mui/icons-material/FolderOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import { Folder, Note } from '../types';
import { foldersApi } from '../services/api';

interface FolderSidebarProps {
  folders: Folder[];
  allNotes: Note[];
  unorganizedNotes: Note[];
  selectedView: 'all' | 'unorganized' | string;
  onSelectView: (view: 'all' | 'unorganized' | string) => void;
  onSelectNote: (note: Note) => void;
  onDeleteFolder: (folderId: string) => void;
  onRefresh: () => void;
  onDropOnFolder?: (folderId: string) => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  folders,
  allNotes,
  unorganizedNotes,
  selectedView,
  onSelectView,
  onSelectNote,
  onDeleteFolder,
  onRefresh,
  onDropOnFolder,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderNotes, setFolderNotes] = useState<{ [key: string]: Note[] }>({});
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  useEffect(() => {
    loadFolderNotes();
  }, [folders]);

  const loadFolderNotes = async () => {
    const notesMap: { [key: string]: Note[] } = {};
    for (const folder of folders) {
      try {
        const response = await foldersApi.getNotes(folder.id);
        notesMap[folder.id] = response.data;
      } catch (error) {
        notesMap[folder.id] = [];
      }
    }
    setFolderNotes(notesMap);
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    onDeleteFolder(folderId);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolder(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    onDropOnFolder?.(folderId);
  };

  return (
    <Box
      sx={{
        width: 280,
        borderRight: 1,
        borderColor: 'divider',
        height: '100%',
        overflow: 'auto',
        bgcolor: 'background.paper',
      }}
    >
      <List dense>
        <ListItemButton
          selected={selectedView === 'all'}
          onClick={() => onSelectView('all')}
        >
          <ListItemIcon>
            <AllInboxIcon />
          </ListItemIcon>
          <ListItemText
            primary="All Notes"
            secondary={`${allNotes.length} notes`}
          />
        </ListItemButton>

        <ListItemButton
          selected={selectedView === 'unorganized'}
          onClick={() => onSelectView('unorganized')}
        >
          <ListItemIcon>
            <FolderOffIcon />
          </ListItemIcon>
          <ListItemText
            primary="Unorganized"
            secondary={`${unorganizedNotes.length} notes`}
          />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {folders.map((folder) => (
          <Box key={folder.id}>
            <ListItemButton
              selected={selectedView === folder.id}
              onClick={() => {
                onSelectView(folder.id);
                if (!expandedFolders.has(folder.id)) {
                  toggleFolder(folder.id);
                }
              }}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
              sx={{
                bgcolor: dragOverFolder === folder.id ? 'action.hover' : 'inherit',
                transition: 'background-color 0.2s',
              }}
            >
              <ListItemIcon>
                <FolderIcon sx={{ color: folder.color || 'inherit' }} />
              </ListItemIcon>
              <ListItemText
                primary={folder.name}
                secondary={`${folderNotes[folder.id]?.length || 0} notes`}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
              >
                {expandedFolders.has(folder.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => handleDeleteFolder(e, folder.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemButton>

            <Collapse in={expandedFolders.has(folder.id)} timeout="auto" unmountOnExit>
              <List component="div" disablePadding dense>
                {folderNotes[folder.id]?.map((note) => (
                  <ListItemButton
                    key={note.id}
                    sx={{ pl: 6 }}
                    onClick={() => onSelectNote(note)}
                  >
                    <ListItemIcon>
                      <DescriptionIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          {note.title || 'Untitled'}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
                {(!folderNotes[folder.id] || folderNotes[folder.id].length === 0) && (
                  <ListItem sx={{ pl: 6 }}>
                    <ListItemText
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          No notes in this folder
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Collapse>
          </Box>
        ))}
      </List>
    </Box>
  );
};

export default FolderSidebar;