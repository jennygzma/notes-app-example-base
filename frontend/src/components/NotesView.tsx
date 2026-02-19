import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NotesList from './NotesList';
import NoteDetail from './NoteDetail';
import ConvertToTaskDialog from './ConvertToTaskDialog';
import FolderSidebar from './FolderSidebar';
import OrganizeDialog from './OrganizeDialog';
import { Note, PlannerItem, CategorizeResponse, TranslateResponse, Folder, OrganizeResponse } from '../types';
import { notesApi, inspirationsApi, aiApi, plannerApi, linksApi, foldersApi } from '../services/api';

interface NotesViewProps {
  initialSelectedNoteId?: string | null;
  onNavigateToTask?: (taskId: string) => void;
  onNavigateToInspiration?: (category: string) => void;
}

const NotesView: React.FC<NotesViewProps> = ({ initialSelectedNoteId, onNavigateToTask, onNavigateToInspiration }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkedItems, setLinkedItems] = useState<PlannerItem[]>([]);
  const [noteCategory, setNoteCategory] = useState<string | null>(null);
  const [categorizingNoteId, setCategorizingNoteId] = useState<string | null>(null);
  const [translatingNoteId, setTranslatingNoteId] = useState<string | null>(null);
  const [translateSuggestions, setTranslateSuggestions] = useState<TranslateResponse | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  
  // Folders state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [unorganizedNotes, setUnorganizedNotes] = useState<Note[]>([]);
  const [selectedView, setSelectedView] = useState<'all' | 'unorganized' | string>('all');
  const [organizeDialogOpen, setOrganizeDialogOpen] = useState(false);
  const [organizeSuggestions, setOrganizeSuggestions] = useState<OrganizeResponse | null>(null);
  const [organizeLoading, setOrganizeLoading] = useState(false);
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);
  
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    category: string;
    categoryId: string;
    noteId: string;
    reasoning: string;
  } | null>(null);

  useEffect(() => {
    loadNotes();
    loadFolders();
    loadUnorganizedNotes();
  }, []);

  useEffect(() => {
    if (selectedNote) {
      loadLinkedItems(selectedNote.id);
      if (selectedNote.is_inspiration) {
        loadNoteCategory(selectedNote.id);
      } else {
        setNoteCategory(null);
      }
    }
  }, [selectedNote]);

  const loadNotes = async () => {
    try {
      const response = await notesApi.getAll();
      setNotes(response.data);
    } catch (error) {
      showSnackbar('Failed to load notes', 'error');
    }
  };

  const loadFolders = async () => {
    try {
      const response = await foldersApi.getAll();
      setFolders(response.data);
    } catch (error) {
      showSnackbar('Failed to load folders', 'error');
    }
  };

  const loadUnorganizedNotes = async () => {
    try {
      const response = await foldersApi.getUnorganized();
      setUnorganizedNotes(response.data);
    } catch (error) {
      setUnorganizedNotes([]);
    }
  };

  const loadLinkedItems = async (noteId: string) => {
    try {
      const response = await notesApi.getLinks(noteId);
      setLinkedItems(response.data);
    } catch (error) {
      setLinkedItems([]);
    }
  };

  const loadNoteCategory = async (noteId: string) => {
    try {
      const response = await inspirationsApi.getByNoteId(noteId);
      if (response.data && response.data.length > 0) {
        setNoteCategory(response.data[0].category);
      } else {
        setNoteCategory(null);
      }
    } catch (error) {
      setNoteCategory(null);
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

  const handleCategorize = async (noteId: string) => {
    setCategorizingNoteId(noteId);
    try {
      const classifyResponse = await aiApi.classify(noteId);
      const classification = classifyResponse.data;

      if (classification.classification === 'task') {
        setCategorizingNoteId(null);
        await handleConvertToTask(noteId);
      } else {
        const response = await inspirationsApi.categorize(noteId);
        const result: CategorizeResponse = response.data;

        if (result.is_new_category) {
          setCategoryDialog({
            open: true,
            category: result.category,
            categoryId: result.category_id!,
            noteId: noteId,
            reasoning: result.reasoning || '',
          });
        } else {
          showSnackbar(`Categorized as "${result.category}"`, 'success');
        }
        setCategorizingNoteId(null);
      }
    } catch (error) {
      showSnackbar('Failed to process note with AI', 'error');
      setCategorizingNoteId(null);
    }
  };

  const handleApproveCategory = async () => {
    if (!categoryDialog) return;

    try {
      await inspirationsApi.approveCategory(categoryDialog.categoryId, categoryDialog.noteId);
      showSnackbar(`Category "${categoryDialog.category}" approved`, 'success');
      setCategoryDialog(null);
    } catch (error) {
      showSnackbar('Failed to approve category', 'error');
    }
  };

  const handleRejectCategory = async () => {
    if (!categoryDialog) return;

    try {
      await inspirationsApi.rejectCategory(categoryDialog.categoryId);
      showSnackbar('Category rejected', 'info');
      setCategoryDialog(null);
    } catch (error) {
      showSnackbar('Failed to reject category', 'error');
    }
  };

  const handleConvertToTask = async (noteId: string) => {
    setTranslatingNoteId(noteId);
    setConvertDialogOpen(true);
    try {
      const response = await aiApi.translate(noteId);
      setTranslateSuggestions(response.data);
    } catch (error) {
      showSnackbar('Failed to generate task suggestions', 'error');
      setConvertDialogOpen(false);
    } finally {
      setTranslatingNoteId(null);
    }
  };

  const handleConfirmTask = async (task: {
    title: string;
    body: string;
    date: string;
    time?: string;
    view_type: 'weekly' | 'monthly';
  }) => {
    if (!selectedNote) return;

    try {
      const taskResponse = await plannerApi.create(task);
      const createdTask = taskResponse.data;
      await linksApi.create(selectedNote.id, createdTask.id);
      await notesApi.markAnalyzed(selectedNote.id);

      showSnackbar('Task created and linked to note', 'success');
      
      loadNotes();
      loadLinkedItems(selectedNote.id);
    } catch (error) {
      showSnackbar('Failed to create task', 'error');
    }
  };

  // Folders handlers
  const handleOrganize = async () => {
    setOrganizeLoading(true);
    setOrganizeDialogOpen(true);
    try {
      const response = await foldersApi.organize();
      setOrganizeSuggestions(response.data);
    } catch (error) {
      showSnackbar('Failed to organize notes', 'error');
      setOrganizeDialogOpen(false);
    } finally {
      setOrganizeLoading(false);
    }
  };

  const handleApplyOrganization = async (data: OrganizeResponse) => {
    try {
      await foldersApi.applyOrganization(data);
      showSnackbar('Notes organized successfully', 'success');
      await loadFolders();
      await loadUnorganizedNotes();
      await loadNotes();
    } catch (error) {
      showSnackbar('Failed to apply organization', 'error');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await foldersApi.delete(folderId);
      showSnackbar('Folder deleted', 'success');
      await loadFolders();
      await loadUnorganizedNotes();
    } catch (error) {
      showSnackbar('Failed to delete folder', 'error');
    }
  };

  const handleDragStart = (note: Note) => {
    setDraggedNote(note);
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
  };

  const handleDropOnFolder = async (folderId: string) => {
    if (!draggedNote) return;

    try {
      await foldersApi.addNoteToFolder(draggedNote.id, folderId);
      showSnackbar('Note added to folder', 'success');
      await loadUnorganizedNotes();
    } catch (error) {
      showSnackbar('Failed to add note to folder', 'error');
    }
  };

  const getDisplayNotes = (): Note[] => {
    if (selectedView === 'all') {
      return notes;
    } else if (selectedView === 'unorganized') {
      return unorganizedNotes;
    } else {
      // Filter notes by folder (will be implemented when notes are loaded with folder info)
      return notes;
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <FolderSidebar
        folders={folders}
        allNotes={notes}
        unorganizedNotes={unorganizedNotes}
        selectedView={selectedView}
        onSelectView={setSelectedView}
        onSelectNote={setSelectedNote}
        onDeleteFolder={handleDeleteFolder}
        onRefresh={() => {
          loadFolders();
          loadUnorganizedNotes();
        }}
        onDropOnFolder={handleDropOnFolder}
      />
      
      <NotesList
        notes={getDisplayNotes()}
        selectedNoteId={selectedNote?.id || null}
        onSelectNote={setSelectedNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
      
      <NoteDetail
        note={selectedNote}
        onUpdate={handleUpdateNote}
        onDelete={handleDeleteNote}
        onCategorize={handleCategorize}
        onConvertToTask={handleConvertToTask}
        linkedItems={linkedItems}
        onNavigateToItem={(item) => onNavigateToTask?.(item.id)}
        inspirationCategory={noteCategory}
        onNavigateToInspiration={(category) => onNavigateToInspiration?.(category)}
        categorizingNoteId={categorizingNoteId}
        translatingNoteId={translatingNoteId}
      />

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
        onApply={handleApplyOrganization}
        suggestions={organizeSuggestions}
        loading={organizeLoading}
        allNotes={notes}
      />

      <ConvertToTaskDialog
        open={convertDialogOpen}
        onClose={() => {
          setConvertDialogOpen(false);
          setTranslateSuggestions(null);
        }}
        onConfirm={handleConfirmTask}
        suggestions={translateSuggestions}
        loading={translatingNoteId !== null}
      />

      <Dialog open={categoryDialog?.open || false} onClose={handleRejectCategory}>
        <DialogTitle>New Category Discovered</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            AI suggests a new category: <strong>{categoryDialog?.category}</strong>
          </Typography>
          {categoryDialog?.reasoning && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {categoryDialog.reasoning}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectCategory}>Reject</Button>
          <Button onClick={handleApproveCategory} variant="contained">
            Approve
          </Button>
        </DialogActions>
      </Dialog>

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