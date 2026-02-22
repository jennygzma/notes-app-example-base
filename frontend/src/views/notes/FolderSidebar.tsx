import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useDroppable } from '@dnd-kit/core';
import { Folder, Note } from '../../types';
import { foldersApi } from '../../services/api';
import Button from '../../components/design-system/Button';

interface DroppableFolderItemProps {
  folder: Folder | null;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  noteCount: number;
  children?: React.ReactNode;
}

const DroppableFolderItem: React.FC<DroppableFolderItemProps> = ({
  folder,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  noteCount,
  children,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: folder?.id || 'unorganized',
    data: { folderId: folder?.id || null },
  });

  return (
    <ListItem
      ref={setNodeRef}
      disablePadding
      secondaryAction={
        folder && onEdit && onDelete ? (
          <Box>
            <IconButton edge="end" size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton edge="end" size="small" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : undefined
      }
      sx={{
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s',
      }}
    >
      <ListItemButton selected={isSelected} onClick={onSelect}>
        {folder ? (
          <FolderIcon sx={{ mr: 1, color: folder.color || '#808080' }} />
        ) : (
          <FolderOpenIcon sx={{ mr: 1, color: 'text.secondary' }} />
        )}
        <ListItemText
          primary={folder?.name || 'Unorganized'}
          secondary={folder?.description}
        />
        <Chip label={noteCount} size="small" />
      </ListItemButton>
      {children}
    </ListItem>
  );
};

interface FolderSidebarProps {
  notes: Note[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onAutoOrganize?: () => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  notes,
  selectedFolderId,
  onSelectFolder,
  onAutoOrganize,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState('#808080');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const folders = await foldersApi.getAll();
      setFolders(folders);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const getNotesCount = (folderId: string | null): number => {
    return notes.filter(note => note.folder_id === folderId).length;
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderDescription('');
    setFolderColor('#808080');
    setDialogOpen(true);
  };

  const handleEditFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDescription(folder.description || '');
    setFolderColor(folder.color || '#808080');
    setDialogOpen(true);
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this folder? Notes will be moved to Unorganized.')) {
      try {
        await foldersApi.delete(folderId);
        loadFolders();
        if (selectedFolderId === folderId) {
          onSelectFolder(null);
        }
      } catch (error) {
        console.error('Failed to delete folder:', error);
      }
    }
  };

  const handleSaveFolder = async () => {
    try {
      if (editingFolder) {
        await foldersApi.update(editingFolder.id, {
          name: folderName,
          description: folderDescription,
          color: folderColor,
        });
      } else {
        await foldersApi.create({
          name: folderName,
          description: folderDescription,
          color: folderColor,
        });
      }
      loadFolders();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save folder:', error);
    }
  };

  return (
    <Box
      sx={{
        width: 250,
        borderRight: 1,
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Folders</Typography>
          <IconButton size="small" onClick={handleCreateFolder}>
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        <DroppableFolderItem
          folder={null}
          isSelected={selectedFolderId === null}
          onSelect={() => onSelectFolder(null)}
          noteCount={getNotesCount(null)}
        />

        {onAutoOrganize && getNotesCount(null) > 0 && (
          <Box sx={{ px: 2, py: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={onAutoOrganize}
            >
              🤖 Auto-Organize
            </Button>
          </Box>
        )}

        {folders.map((folder) => (
          <DroppableFolderItem
            key={folder.id}
            folder={folder}
            isSelected={selectedFolderId === folder.id}
            onSelect={() => onSelectFolder(folder.id)}
            onEdit={(e) => handleEditFolder(folder, e)}
            onDelete={(e) => handleDeleteFolder(folder.id, e)}
            noteCount={getNotesCount(folder.id)}
          />
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFolder ? 'Edit Folder' : 'Create Folder'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={folderDescription}
            onChange={(e) => setFolderDescription(e.target.value)}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Color
            </Typography>
            <input
              type="color"
              value={folderColor}
              onChange={(e) => setFolderColor(e.target.value)}
              style={{ width: '100%', height: 40, cursor: 'pointer' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveFolder} variant="contained" disabled={!folderName.trim()}>
            {editingFolder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FolderSidebar;