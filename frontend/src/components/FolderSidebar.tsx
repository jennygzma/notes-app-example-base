import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import FolderOffIcon from '@mui/icons-material/FolderOff';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
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
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
      await loadFolders();
      onFoldersChange();
      setDeleteConfirm(null);
      if (selectedFolderId === folderId) {
        onSelectFolder(null);
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolder(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolder(null);
    const noteId = e.dataTransfer.getData('note_id');
    if (noteId) {
      onDropNote(noteId, folderId);
    }
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
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Folders</Typography>
        <IconButton size="small" onClick={() => setCreateDialogOpen(true)}>
          <AddIcon />
        </IconButton>
      </Box>

      <List dense sx={{ flex: 1 }}>
        <ListItemButton
          selected={selectedFolderId === null}
          onClick={() => onSelectFolder(null)}
        >
          <ListItemIcon>
            <AllInboxIcon />
          </ListItemIcon>
          <ListItemText primary="All Notes" />
        </ListItemButton>

        <ListItemButton
          selected={selectedFolderId === 'unorganized'}
          onClick={() => onSelectFolder('unorganized')}
        >
          <ListItemIcon>
            <FolderOffIcon />
          </ListItemIcon>
          <ListItemText primary="Unorganized" />
        </ListItemButton>

        {folders.map((folder) => (
          <ListItem
            key={folder.id}
            disablePadding
            onDragOver={(e) => handleDragOver(e, folder.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, folder.id)}
            sx={{
              bgcolor: dragOverFolder === folder.id ? 'action.hover' : 'inherit',
              transition: 'background-color 0.2s',
            }}
          >
            <ListItemButton
              selected={selectedFolderId === folder.id}
              onClick={() => onSelectFolder(folder.id)}
            >
              <ListItemIcon>
                <FolderIcon sx={{ color: folder.color || 'inherit' }} />
              </ListItemIcon>
              <ListItemText
                primary={folder.name}
                secondary={`${folder.note_count || 0} notes`}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(folder.id);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Folder?</DialogTitle>
        <DialogContent>
          <Typography>
            This will remove the folder and unassign all notes from it. The notes themselves will not be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => deleteConfirm && handleDeleteFolder(deleteConfirm)}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FolderSidebar;