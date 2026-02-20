import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NotesList from './NotesList';
import NoteDetail from './NoteDetail';
import FolderSidebar from './FolderSidebar';
import OrganizeDialog from './OrganizeDialog';
import { Note, PlannerItem, OrganizeResponse } from '../types';
import { notesApi, foldersApi } from '../services/api';

interface NotesViewProps {
  initialSelectedNoteId?: string | null;
  onNavigateToTask?: (taskId: string) => void;
  onNavigateToInspiration?: (category: string) => void;
}

const NotesView: React.FC<NotesViewProps> = ({
  initialSelectedNoteId,
  onNavigateToTask,
  onNavigateToInspiration,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  const [organizeDialogOpen, setOrganizeDialogOpen] = useState(false);
  const [organizeSuggestions, setOrganizeSuggestions] = useState<OrganizeResponse | null>(null);
  const [organizeLoading, setOrganizeLoading] = useState(false);
  
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (initialSelectedNoteId) {
      const note = notes.find(n => n.id === initialSelectedNoteId);
      if (note) {
        setSelectedNote(note);
      }
    }
  }, [initialSelectedNoteId, notes]);

  const loadNotes = async () => {
    try {
      const response = await notesApi.getAll();
      setNotes(response.data);
    } catch (error) {
      showSnackbar('Failed to load notes', 'error');
    }
  };

  const handleCreateNote = async () => {
    try {
      const response = await notesApi.create({ title: 'New Note', body: '' });
      const newNote = response.data;
      setNotes([newNote, ...notes]);
      setSelectedNote(newNote);
      showSnackbar('Note created', 'success');
    } catch (error) {
      showSnackbar('Failed to create note', 'error');
    }
  };

  const handleUpdateNote = async (id: string, title: string, body: string) => {
    try {
      const response = await notesApi.update(id, { title, body });
      setNotes(notes.map(n => n.id === id ? response.data : n));
      setSelectedNote(response.data);
      showSnackbar('Note saved', 'success');
    } catch (error) {
      showSnackbar('Failed to save note', 'error');
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await notesApi.delete(id);
      setNotes(notes.filter(n => n.id !== id));
      setSelectedNote(null);
      showSnackbar('Note deleted', 'success');
    } catch (error) {
      showSnackbar('Failed to delete note', 'error');
    }
  };

  const handleOrganize = async () => {
    setOrganizeLoading(true);
    setOrganizeDialogOpen(true);
    try {
      const response = await foldersApi.organizePreview();
      setOrganizeSuggestions(response.data);
    } catch (error) {
      showSnackbar('Failed to organize notes', 'error');
      setOrganizeDialogOpen(false);
    } finally {
      setOrganizeLoading(false);
    }
  };

  const handleApplyOrganization = async () => {
    if (!organizeSuggestions) return;
    
    try {
      await foldersApi.organizeApply(organizeSuggestions);
      showSnackbar('Notes organized successfully', 'success');
      setOrganizeDialogOpen(false);
      setOrganizeSuggestions(null);
      await loadNotes();
    } catch (error) {
      showSnackbar('Failed to apply organization', 'error');
    }
  };

  const handleDropNote = async (noteId: string, folderId: string | null) => {
    try {
      if (folderId === null) {
        await foldersApi.updateForNote(noteId, []);
      } else {
        await foldersApi.updateForNote(noteId, [folderId]);
      }
      showSnackbar('Note moved to folder', 'success');
      await loadNotes();
    } catch (error) {
      showSnackbar('Failed to move note', 'error');
    }
  };

  const getFilteredNotes = (): Note[] => {
    let filtered = notes;
    
    if (selectedFolderId === 'unorganized') {
      // This would need a separate API call to get unorganized notes
      // For now, show all notes
      filtered = notes;
    } else if (selectedFolderId) {
      // This would need to filter by folder
      // For now, show all notes
      filtered = notes;
    }
    
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.body.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <FolderSidebar
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onFoldersChange={loadNotes}
        onDropNote={handleDropNote}
      />
      
      <NotesList
        notes={getFilteredNotes()}
        selectedNoteId={selectedNote?.id || null}
        onSelectNote={setSelectedNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      {selectedNote && (
        <NoteDetail
          note={selectedNote}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
          onCategorize={async () => {}}
          onConvertToTask={async () => {}}
          linkedItems={[]}
          onNavigateToItem={(item: PlannerItem) => onNavigateToTask?.(item.id)}
          inspirationCategory={null}
          onNavigateToInspiration={(category: string) => onNavigateToInspiration?.(category)}
          categorizingNoteId={null}
          translatingNoteId={null}
        />
      )}

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreateNote}
      >
        <AddIcon />
      </Fab>

      <Fab
        color="secondary"
        sx={{ position: 'fixed', bottom: 16, right: 88 }}
        onClick={handleOrganize}
      >
        <AutoAwesomeIcon />
      </Fab>

      <OrganizeDialog
        open={organizeDialogOpen}
        onClose={() => {
          setOrganizeDialogOpen(false);
          setOrganizeSuggestions(null);
        }}
        onApproved={handleApplyOrganization}
        suggestions={organizeSuggestions}
        loading={organizeLoading}
        allNotes={notes}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotesView;