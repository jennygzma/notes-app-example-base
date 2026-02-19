import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  TextField,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import FolderOffIcon from '@mui/icons-material/FolderOff';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Folder, Note } from '../types';
import { foldersApi, notesApi } from '../services/api';

interface FolderSidebarProps {
  notes: Note[];
  selectedFilter: 'all' | 'unorganized' | string;
  onFilterChange: (filter: 'all' | 'unorganized' | string) => void;
  onFoldersChange: () => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  notes,
  selectedFilter,
  onFilterChange,
  onFoldersChange,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

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
      await foldersApi.create({ name: newFolderName });
      setNewFolderName('');
      setIsCreating(false);
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
      if (selectedFilter === folderId) {
        onFilterChange('all');
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOver(targetId);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOver(null);

    const noteId = e.dataTransfer.getData('noteId');
    if (!noteId) return;

    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const currentFolderIds = note.folder_ids || [];
      
      if (folderId === null) {
        await foldersApi.updateNoteFolders(noteId, []);
      } else {
        const newFolderIds = Array.from(new Set([...currentFolderIds, folderId]));
        await foldersApi.updateNoteFolders(noteId, newFolderIds);
      }
      
      onFoldersChange();
    } catch (error) {
      console.error('Failed to update note folders:', error);
    }
  };

  const getFolderCount = (folderId: string) => {
    return notes.filter(note => note.folder_ids?.includes(folderId)).length;
  };

  const getUnorganizedCount = () => {
    return notes.filter(note => !note.folder_ids || note.folder_ids.length === 0).length;
  };

  return (
    <Box sx={{ width: 240, borderRight: 1, borderColor: 'divider', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Folders</Typography>
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto' }}>
        <ListItemButton
          selected={selectedFilter === 'all'}
          onClick={() => onFilterChange('all')}
        >
          <ListItemIcon>
            <AllInboxIcon />
          </ListItemIcon>
          <ListItemText primary="All Notes" />
          <Chip label={notes.length} size="small" />
        </ListItemButton>

        <ListItemButton
          selected={selectedFilter === 'unorganized'}
          onClick={() => onFilterChange('unorganized')}
          onDragOver={(e) => handleDragOver(e, 'unorganized')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          sx={{
            backgroundColor: dragOver === 'unorganized' ? 'action.hover' : undefined,
          }}
        >
          <ListItemIcon>
            <FolderOffIcon />
          </ListItemIcon>
          <ListItemText primary="Unorganized" />
          <Chip label={getUnorganizedCount()} size="small" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {folders.map((folder) => (
          <ListItem
            key={folder.id}
            disablePadding
            secondaryAction={
              deletingId === folder.id ? (
                <Box>
                  <IconButton size="small" onClick={() => handleDeleteFolder(folder.id)}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setDeletingId(null)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <IconButton size="small" onClick={() => setDeletingId(folder.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )
            }
          >
            <ListItemButton
              selected={selectedFilter === folder.id}
              onClick={() => onFilterChange(folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
              sx={{
                backgroundColor: dragOver === folder.id ? 'action.hover' : undefined,
              }}
            >
              <ListItemIcon>
                <FolderIcon sx={{ color: folder.color || undefined }} />
              </ListItemIcon>
              <ListItemText 
                primary={folder.name}
                secondary={`${getFolderCount(folder.id)} notes`}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        {isCreating ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <IconButton size="small" onClick={handleCreateFolder}>
              <CheckIcon />
            </IconButton>
            <IconButton size="small" onClick={() => { setIsCreating(false); setNewFolderName(''); }}>
              <CloseIcon />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton onClick={() => setIsCreating(true)}>
              <AddIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FolderSidebar;