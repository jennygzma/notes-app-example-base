import React, { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Folder as FolderIcon } from '@mui/icons-material';
import { Folder } from '../types';

interface FolderSidebarProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  folders: Folder[];
  onFoldersChange: () => void;
  onNoteDrop: (noteId: string, folderId: string | null) => void;
  onOrganizeWithAI: () => void;
  organizing: boolean;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  selectedFolderId,
  onFolderSelect,
  folders,
  onFoldersChange,
  onNoteDrop,
  onOrganizeWithAI,
  organizing,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('http://localhost:5001/api/folders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (response.ok) {
        setNewFolderName('');
        setIsCreating(false);
        onFoldersChange();
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      const response = await fetch(`http://localhost:5001/api/folders/${folderToDelete.id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (selectedFolderId === folderToDelete.id) {
          onFolderSelect(null);
        }
        setDeleteDialogOpen(false);
        setFolderToDelete(null);
        onFoldersChange();
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('noteId');
    if (noteId) {
      onNoteDrop(noteId, folderId);
    }
    setDragOverId(null);
  };

  return (
    <Box sx={{ width: 240, borderRight: 1, borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Folders</Typography>
      </Box>

      <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <ListItem
          onDragOver={(e) => handleDragOver(e, null)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          sx={{
            backgroundColor: selectedFolderId === null ? 'action.selected' : dragOverId === null ? 'action.hover' : 'transparent',
          }}
        >
          <ListItemButton onClick={() => onFolderSelect(null)}>
            <ListItemText primary="All Notes" />
          </ListItemButton>
        </ListItem>

        <ListItem
          onDragOver={(e) => handleDragOver(e, 'unorganized')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          sx={{
            backgroundColor: selectedFolderId === 'unorganized' ? 'action.selected' : dragOverId === 'unorganized' ? 'action.hover' : 'transparent',
          }}
        >
          <ListItemButton onClick={() => onFolderSelect('unorganized')}>
            <ListItemText primary="Unorganized" secondary={`(${folders.reduce((sum, f) => sum + (f.note_count || 0), 0)} notes)`} />
          </ListItemButton>
        </ListItem>

        {folders.map((folder) => (
          <ListItem
            key={folder.id}
            onDragOver={(e) => handleDragOver(e, folder.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, folder.id)}
            sx={{
              backgroundColor: selectedFolderId === folder.id ? 'action.selected' : dragOverId === folder.id ? 'action.hover' : 'transparent',
            }}
            secondaryAction={
              <IconButton
                edge="end"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderToDelete(folder);
                  setDeleteDialogOpen(true);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemButton onClick={() => onFolderSelect(folder.id)}>
              <FolderIcon sx={{ mr: 1, color: folder.color || 'text.secondary' }} />
              <ListItemText primary={folder.name} secondary={`${folder.note_count || 0} notes`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onOrganizeWithAI}
          disabled={organizing}
        >
          {organizing ? 'Organizing...' : 'Organize with AI'}
        </Button>
        
        {isCreating ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                }
              }}
              autoFocus
            />
            <Button size="small" onClick={handleCreateFolder}>Add</Button>
            <Button size="small" onClick={() => { setIsCreating(false); setNewFolderName(''); }}>Cancel</Button>
          </Box>
        ) : (
          <Button startIcon={<AddIcon />} fullWidth onClick={() => setIsCreating(true)}>
            New Folder
          </Button>
        )}
      </Box>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Folder</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{folderToDelete?.name}"? Notes in this folder will not be deleted, but will become unorganized.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteFolder} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FolderSidebar;