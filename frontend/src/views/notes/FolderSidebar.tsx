import React, { useState } from 'react';
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
  Menu,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Folder } from '../../types';
import Button from '../../components/design-system/Button';

interface FolderSidebarProps {
  folders: Folder[];
  unorganizedCount: number;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, description?: string, color?: string) => void;
  onUpdateFolder: (id: string, name: string, description?: string, color?: string) => void;
  onDeleteFolder: (id: string) => void;
  onAutoOrganize: () => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  folders,
  unorganizedCount,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onAutoOrganize,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState('#808080');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuFolder, setMenuFolder] = useState<Folder | null>(null);

  const handleOpenCreateDialog = () => {
    setFolderName('');
    setFolderDescription('');
    setFolderColor('#808080');
    setEditingFolder(null);
    setCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (folder: Folder) => {
    setFolderName(folder.name);
    setFolderDescription(folder.description || '');
    setFolderColor(folder.color || '#808080');
    setEditingFolder(folder);
    setCreateDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setEditingFolder(null);
    setFolderName('');
    setFolderDescription('');
    setFolderColor('#808080');
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) return;

    if (editingFolder) {
      onUpdateFolder(editingFolder.id, folderName, folderDescription, folderColor);
    } else {
      onCreateFolder(folderName, folderDescription, folderColor);
    }
    handleCloseDialog();
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, folder: Folder) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuFolder(folder);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuFolder(null);
  };

  const handleDeleteFolder = () => {
    if (menuFolder) {
      onDeleteFolder(menuFolder.id);
    }
    handleCloseMenu();
  };

  return (
    <Box
      sx={{
        width: 250,
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Folders</Typography>
          <IconButton size="small" onClick={handleOpenCreateDialog}>
            <AddIcon />
          </IconButton>
        </Box>
        {unorganizedCount > 0 && (
          <Button
            size="small"
            fullWidth
            variant="outlined"
            onClick={onAutoOrganize}
            sx={{ fontSize: '0.75rem' }}
          >
            Auto-Organize ({unorganizedCount} notes)
          </Button>
        )}
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        <ListItem disablePadding>
          <ListItemButton
            selected={selectedFolderId === null}
            onClick={() => onSelectFolder(null)}
          >
            <FolderOpenIcon sx={{ mr: 1, color: '#9e9e9e' }} />
            <ListItemText primary="Unorganized" />
            <Typography variant="caption" color="text.secondary">
              {unorganizedCount}
            </Typography>
          </ListItemButton>
        </ListItem>

        {folders.map((folder) => (
          <ListItem key={folder.id} disablePadding>
            <ListItemButton
              selected={selectedFolderId === folder.id}
              onClick={() => onSelectFolder(folder.id)}
            >
              <FolderIcon sx={{ mr: 1, color: folder.color || '#808080' }} />
              <ListItemText primary={folder.name} />
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                {folder.note_count || 0}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => handleOpenMenu(e, folder)}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Dialog open={createDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFolder ? 'Edit Folder' : 'Create Folder'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Folder Name"
            fullWidth
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={folderDescription}
            onChange={(e) => setFolderDescription(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['#808080', '#ef5350', '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#26c6da'].map((color) => (
                <Box
                  key={color}
                  onClick={() => setFolderColor(color)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: color,
                    cursor: 'pointer',
                    border: folderColor === color ? '2px solid #000' : '2px solid transparent',
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveFolder} variant="contained" disabled={!folderName.trim()}>
            {editingFolder ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => { if (menuFolder) handleOpenEditDialog(menuFolder); }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteFolder}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FolderSidebar;