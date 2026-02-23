import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import { useDroppable } from '@dnd-kit/core';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import Dialog from '../../components/shared/Dialog';
import InlineConfirmButton from '../../components/shared/InlineConfirmButton';
import { FolderWithCount } from '../../types';
import { foldersApi } from '../../services/api';

interface FolderSidebarProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onFoldersChange: () => void;
}

const DroppableFolderItem: React.FC<{
  id: string;
  isSelected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  primary: string;
  secondary?: string;
  count: number;
  secondaryAction?: React.ReactNode;
}> = ({ id, isSelected, onClick, icon, primary, secondary, count, secondaryAction }) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <ListItem
      ref={setNodeRef}
      disablePadding
      secondaryAction={secondaryAction}
      sx={{
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s',
      }}
    >
      <ListItemButton selected={isSelected} onClick={onClick}>
        {icon}
        <ListItemText
          primary={primary}
          secondary={secondary}
          secondaryTypographyProps={{ noWrap: true }}
        />
        <Chip label={count} size="small" />
      </ListItemButton>
    </ListItem>
  );
};

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  selectedFolderId,
  onSelectFolder,
  onFoldersChange,
}) => {
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [unorganizedCount, setUnorganizedCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderWithCount | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState('#808080');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const response = await foldersApi.getAll();
      setFolders(response.folders);
      setUnorganizedCount(response.unorganized_count);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderDescription('');
    setFolderColor('#808080');
    setDialogOpen(true);
  };

  const handleEditFolder = (folder: FolderWithCount, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDescription(folder.description || '');
    setFolderColor(folder.color);
    setDialogOpen(true);
  };

  const handleSaveFolder = async () => {
    try {
      if (editingFolder) {
        await foldersApi.update(editingFolder.id, {
          name: folderName,
          description: folderDescription || undefined,
          color: folderColor,
        });
      } else {
        await foldersApi.create({
          name: folderName,
          description: folderDescription || undefined,
          color: folderColor,
        });
      }
      setDialogOpen(false);
      loadFolders();
      onFoldersChange();
    } catch (error) {
      console.error('Failed to save folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await foldersApi.delete(folderId);
      loadFolders();
      onFoldersChange();
      if (selectedFolderId === folderId) {
        onSelectFolder(null);
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  return (
    <Box sx={{ width: 280, borderRight: 1, borderColor: 'divider', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Folders</Typography>
        <IconButton size="small" onClick={handleCreateFolder}>
          <AddIcon />
        </IconButton>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
        <DroppableFolderItem
          id="unorganized"
          isSelected={selectedFolderId === null}
          onClick={() => onSelectFolder(null)}
          icon={<FolderIcon sx={{ mr: 2, color: 'text.secondary' }} />}
          primary="Unorganized"
          count={unorganizedCount}
        />

        {folders.length > 0 && <Divider sx={{ my: 1 }} />}

        {folders.map((folder) => (
          <DroppableFolderItem
            key={folder.id}
            id={folder.id}
            isSelected={selectedFolderId === folder.id}
            onClick={() => onSelectFolder(folder.id)}
            icon={<FolderIcon sx={{ mr: 2, color: folder.color }} />}
            primary={folder.name}
            secondary={folder.description || undefined}
            count={folder.note_count}
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={(e) => handleEditFolder(folder, e)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <InlineConfirmButton
                  onConfirm={() => handleDeleteFolder(folder.id)}
                  confirmText="Delete?"
                />
              </Box>
            }
          />
        ))}
      </List>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingFolder ? 'Edit Folder' : 'Create Folder'}
        actions={
          <>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveFolder}
              variant="contained"
              disabled={!folderName.trim()}
            >
              {editingFolder ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={folderDescription}
            onChange={(e) => setFolderDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['#808080', '#87ae73', '#5BB9C2', '#9a4e4e', '#FDB813', '#9e9e9e'].map((color) => (
                <Box
                  key={color}
                  onClick={() => setFolderColor(color)}
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: color,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: folderColor === color ? '3px solid #000' : '1px solid #ddd',
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default FolderSidebar;