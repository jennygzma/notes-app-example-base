import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  AllInbox as AllInboxIcon,
  FolderOff as FolderOffIcon,
} from '@mui/icons-material';
import { Folder } from '../types';
import { foldersApi } from '../services/api';

interface FolderSidebarProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onFoldersChange: () => void;
  onDropNote: (noteId: string, folderId: string | null) => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  selectedFolderId,
  onSelectFolder,
  onFoldersChange,
  onDropNote,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const response = await foldersApi.getAll();
      setFolders(response.data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await foldersApi.create(newFolderName.trim());
      setNewFolderName('');
      setCreateDialogOpen(false);
      await loadFolders();
      onFoldersChange();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await foldersApi.delete(folderId);
      setDeleteConfirmId(null);
      await loadFolders();
      onFoldersChange();
      if (selectedFolderId === folderId) {
        onSelectFolder(null);
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('note_id');
    if (noteId) {
      onDropNote(noteId, folderId);
    }
    setDragOverId(null);
  };

  return (
    <Box
      sx={{
        width: 240,
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Folders</Typography>
        <IconButton size="small" onClick={() => setCreateDialogOpen(true)}>
          <AddIcon />
        </IconButton>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        <ListItem disablePadding>
          <ListItemButton
            selected={selectedFolderId === null}
            onClick={() => onSelectFolder(null)}
          >
            <AllInboxIcon sx={{ mr: 1, fontSize: 20 }} />
            <ListItemText primary="All Notes" />
          </ListItemButton>
        </ListItem>

        <ListItem
          disablePadding
          onDragOver={(e) => handleDragOver(e, 'unorganized')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          sx={{
            bgcolor: dragOverId === 'unorganized' ? 'action.hover' : 'transparent',
          }}
        >
          <ListItemButton
            selected={selectedFolderId === 'unorganized'}
            onClick={() => onSelectFolder('unorganized')}
          >
            <FolderOffIcon sx={{ mr: 1, fontSize: 20 }} />
            <ListItemText primary="Unorganized" />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 1 }} />

        {folders.map((folder) => (
          <ListItem
            key={folder.id}
            disablePadding
            secondaryAction={
              deleteConfirmId === folder.id ? (
                <Box>
                  <Button
                    size="small"
                    onClick={() => handleDeleteFolder(folder.id)}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    Yes
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setDeleteConfirmId(null)}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    No
                  </Button>
                </Box>
              ) : (
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => setDeleteConfirmId(folder.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )
            }
            onDragOver={(e) => handleDragOver(e, folder.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, folder.id)}
            sx={{
              bgcolor: dragOverId === folder.id ? 'action.hover' : 'transparent',
            }}
          >
            <ListItemButton
              selected={selectedFolderId === folder.id}
              onClick={() => onSelectFolder(folder.id)}
            >
              {selectedFolderId === folder.id ? (
                <FolderOpenIcon sx={{ mr: 1, fontSize: 20, color: folder.color }} />
              ) : (
                <FolderIcon sx={{ mr: 1, fontSize: 20, color: folder.color }} />
              )}
              <ListItemText
                primary={
                  <Badge badgeContent={folder.note_count || 0} color="primary" max={999}>
                    <Typography variant="body2" sx={{ pr: 2 }}>
                      {folder.name}
                    </Typography>
                  </Badge>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FolderSidebar;