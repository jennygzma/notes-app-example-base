import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import InboxIcon from '@mui/icons-material/Inbox';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import Dialog from '../../components/shared/Dialog';
import InlineConfirmButton from '../../components/shared/InlineConfirmButton';
import { foldersApi } from '../../services/api';
import { Folder, Note } from '../../types';
import { useDroppable } from '@dnd-kit/core';

interface FolderSidebarProps {
  notes: Note[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onOrganize?: () => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  notes,
  selectedFolderId,
  onFolderSelect,
  onOrganize,
}) => {
  const theme = useTheme();
  const defaultFolderColor = theme.palette.grey[500];
  const [folders, setFolders] = useState<Folder[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: defaultFolderColor,
  });

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const data = await foldersApi.getAll();
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const getFolderNoteCount = (folderId: string | null) => {
    return notes.filter((note) => note.folder_id === folderId).length;
  };

  const handleCreateFolder = async () => {
    try {
      await foldersApi.create(formData);
      setCreateDialogOpen(false);
      setFormData({ name: '', description: '', color: defaultFolderColor });
      loadFolders();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleEditFolder = async () => {
    if (!editingFolder) return;
    try {
      await foldersApi.update(editingFolder.id, formData);
      setEditDialogOpen(false);
      setEditingFolder(null);
      setFormData({ name: '', description: '', color: defaultFolderColor });
      loadFolders();
    } catch (error) {
      console.error('Failed to update folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await foldersApi.delete(folderId);
      if (selectedFolderId === folderId) {
        onFolderSelect(null);
      }
      loadFolders();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const openEditDialog = (folder: Folder) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      description: folder.description || '',
      color: folder.color || defaultFolderColor,
    });
    setEditDialogOpen(true);
  };

  const DroppableFolderRow: React.FC<{
    id: string;
    selected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    count: number;
    actions?: React.ReactNode;
  }> = ({ id, selected, onClick, icon, title, count, actions }) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    return (
      <ListItemButton
        ref={setNodeRef}
        selected={selected}
        onClick={onClick}
        sx={{
          backgroundColor: isOver ? 'action.hover' : 'transparent',
          transition: 'background-color 120ms ease',
        }}
      >
        {icon}
        <ListItemText primary={title} />
        <Chip label={count} size="small" sx={{ mr: actions ? 0.5 : 0 }} />
        {actions}
      </ListItemButton>
    );
  };

  return (
    <Box sx={{ width: 250, borderRight: 1, borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Folders</Typography>
        <IconButton size="small" onClick={() => setCreateDialogOpen(true)}>
          <AddIcon />
        </IconButton>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        <DroppableFolderRow
          id="folder:unorganized"
          selected={selectedFolderId === null}
          onClick={() => onFolderSelect(null)}
          icon={<InboxIcon sx={{ mr: 2, color: 'text.secondary' }} />}
          title="Unorganized"
          count={getFolderNoteCount(null)}
        />

        {onOrganize && getFolderNoteCount(null) > 0 && (
          <Box sx={{ px: 2, py: 1 }}>
            <Button 
              fullWidth 
              variant="outlined" 
              size="small"
              onClick={onOrganize}
            >
              Auto-Organize
            </Button>
          </Box>
        )}

        {folders.map((folder) => (
          <DroppableFolderRow
            key={folder.id}
            id={`folder:${folder.id}`}
            selected={selectedFolderId === folder.id}
            onClick={() => onFolderSelect(folder.id)}
            icon={<FolderIcon sx={{ mr: 2, color: folder.color }} />}
            title={folder.name}
            count={getFolderNoteCount(folder.id)}
            actions={
              <>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditDialog(folder); }}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <InlineConfirmButton onConfirm={() => handleDeleteFolder(folder.id)} />
              </>
            }
          />
        ))}
      </List>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Create Folder"
        actions={
          <>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} variant="contained">Create</Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={2}
          />
          <TextField
            label="Color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ '& input': { height: 40, padding: 0 } }}
          />
        </Stack>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Edit Folder"
        actions={
          <>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditFolder} variant="contained">Save</Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={2}
          />
          <TextField
            label="Color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ '& input': { height: 40, padding: 0 } }}
          />
        </Stack>
      </Dialog>
    </Box>
  );
};

export default FolderSidebar;
