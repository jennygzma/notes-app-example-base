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
import NotesList from './NotesList';
import NoteDetail from './NoteDetail';
import ConvertToTaskDialog from './ConvertToTaskDialog';
import { Note, PlannerItem, CategorizeResponse, TranslateResponse } from '../types';
import { notesApi, inspirationsApi, aiApi, plannerApi, linksApi } from '../services/api';

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
      const notes = await notesApi.getAll();
      setNotes(notes);
    } catch (error) {
      showSnackbar('Failed to load notes', 'error');
    }
  };

  const loadLinkedItems = async (noteId: string) => {
    try {
      const linkedItems = await notesApi.getLinks(noteId);
      setLinkedItems(linkedItems);
    } catch (error) {
      setLinkedItems([]);
    }
  };

  const loadNoteCategory = async (noteId: string) => {
    try {
      const inspirations = await inspirationsApi.getByNoteId(noteId);
      if (inspirations && inspirations.length > 0) {
        setNoteCategory(inspirations[0].category);
      } else {
        setNoteCategory(null);
      }
    } catch (error) {
      setNoteCategory(null);
    }
  };

  const handleCreateNote = async () => {
    try {
      const newNote = await notesApi.create({ title: 'New Note', body: '' });
      setNotes([newNote, ...notes]);
      setSelectedNote(newNote);
      showSnackbar('Note created', 'success');
    } catch (error) {
      showSnackbar('Failed to create note', 'error');
    }
  };

  const handleUpdateNote = async (id: string, title: string, body: string) => {
    try {
      const updatedNote = await notesApi.update(id, { title, body });
      setNotes(notes.map(n => n.id === id ? updatedNote : n));
      setSelectedNote(updatedNote);
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
      // First, classify the note
      const classification = await aiApi.classify(noteId);

      if (classification.classification === 'task') {
        // Route to task conversion
        setCategorizingNoteId(null);
        await handleConvertToTask(noteId);
      } else {
        // Route to inspiration categorization
        const result = await inspirationsApi.categorize(noteId);

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
      const suggestions = await aiApi.translate(noteId);
      setTranslateSuggestions(suggestions);
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
      // Create the planner item
      const createdTask = await plannerApi.create(task);

      // Create the link between note and task
      await linksApi.create(selectedNote.id, createdTask.id);

      // Mark note as analyzed (classified as task)
      await notesApi.markAnalyzed(selectedNote.id);

      showSnackbar('Task created and linked to note', 'success');
      
      // Reload notes and linked items
      loadNotes();
      loadLinkedItems(selectedNote.id);
    } catch (error) {
      showSnackbar('Failed to create task', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <NotesList
        notes={notes}
        selectedNoteId={selectedNote?.id || null}
        onSelectNote={setSelectedNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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