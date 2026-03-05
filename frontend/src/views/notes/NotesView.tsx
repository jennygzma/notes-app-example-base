import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Snackbar,
  Alert,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import NotesList from './NotesList';
import NoteDetail from './NoteDetail';
import ConvertToTaskDialog from './ConvertToTaskDialog';
import FolderSidebar from './FolderSidebar';
import OrganizeDialog from './OrganizeDialog';
import SearchResults from './SearchResults';
import { Note, PlannerItem, CategorizeResponse, TranslateResponse, SearchResult } from '../../types';
import { notesApi, inspirationsApi, aiApi, plannerApi, linksApi, foldersApi } from '../../services/api';
import Dialog from '../../components/shared/Dialog';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';

interface NotesViewProps {
  initialSelectedNoteId?: string | null;
  onNavigateToTask?: (taskId: string) => void;
  onNavigateToInspiration?: (category: string) => void;
}

const NotesView: React.FC<NotesViewProps> = ({ initialSelectedNoteId, onNavigateToTask, onNavigateToInspiration }) => {
  const theme = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [linkedItems, setLinkedItems] = useState<PlannerItem[]>([]);
  const [noteCategory, setNoteCategory] = useState<string | null>(null);
  const [categorizingNoteId, setCategorizingNoteId] = useState<string | null>(null);
  const [translatingNoteId, setTranslatingNoteId] = useState<string | null>(null);
  const [translateSuggestions, setTranslateSuggestions] = useState<TranslateResponse | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [organizeDialogOpen, setOrganizeDialogOpen] = useState(false);
  const [organizeSuggestions, setOrganizeSuggestions] = useState<any>(null);
  const [organizingNotes, setOrganizingNotes] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
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
  }, []);

  useEffect(() => {
    if (initialSelectedNoteId && notes.length > 0) {
      const noteToSelect = notes.find(n => n.id === initialSelectedNoteId);
      if (noteToSelect) {
        setSelectedNote(noteToSelect);
      }
    }
  }, [initialSelectedNoteId, notes]);

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

  const loadFolders = async () => {
    try {
      const folders = await foldersApi.getAll();
      setFolders(folders);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const handleOrganizeNotes = async () => {
    setOrganizingNotes(true);
    setOrganizeDialogOpen(true);
    try {
      const suggestions = await notesApi.organizePreview();
      setOrganizeSuggestions(suggestions);
    } catch (error) {
      showSnackbar('Failed to generate organization suggestions', 'error');
      setOrganizeDialogOpen(false);
    } finally {
      setOrganizingNotes(false);
    }
  };

  const handleApplyOrganization = async (plan: any) => {
    try {
      await notesApi.organizeApply(plan);
      showSnackbar('Notes organized successfully', 'success');
      setOrganizeDialogOpen(false);
      setOrganizeSuggestions(null);
      loadNotes();
      loadFolders();
    } catch (error) {
      showSnackbar('Failed to apply organization', 'error');
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

  const applyNoteUpdate = (updatedNote: Note) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === updatedNote.id);
      if (exists) {
        return prev.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      }
      return [updatedNote, ...prev];
    });
    setSelectedNote(updatedNote);
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
      const classification = await aiApi.classify(noteId);

      if (classification.classification === 'task') {
        setCategorizingNoteId(null);
        await handleConvertToTask(noteId);
      } else {
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
          setNoteCategory(result.category);
          setNotes(prev => prev.map(n => 
            n.id === noteId ? { ...n, is_inspiration: true } : n
          ));
          if (selectedNote?.id === noteId) {
            setSelectedNote(prev => prev ? { ...prev, is_inspiration: true } : null);
          }
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

      setNoteCategory(categoryDialog.category);
      setNotes(prev => prev.map(n => 
        n.id === categoryDialog.noteId ? { ...n, is_inspiration: true } : n
      ));
      if (selectedNote?.id === categoryDialog.noteId) {
        setSelectedNote(prev => prev ? { ...prev, is_inspiration: true } : null);
      }
      
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
      const createdTask = await plannerApi.create(task);

      await linksApi.create(selectedNote.id, createdTask.id);

      await notesApi.markAnalyzed(selectedNote.id);

      showSnackbar('Task created and linked to note', 'success');
      
      loadNotes();
      loadLinkedItems(selectedNote.id);
    } catch (error) {
      showSnackbar('Failed to create task', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const searchNotes = async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const results = await notesApi.search(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Search failed:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchNotes, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectSearchResult = async (result: SearchResult) => {
    try {
      const note = await notesApi.getById(result.note_id);
      setSelectedNote(note);
      if (result.is_version_history && result.version_number) {
        const versions = await notesApi.getVersions(note.id);
        const version = versions.find(v => v.version_number === result.version_number);
        if (version) {
        }
      }
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      showSnackbar('Failed to load note', 'error');
    }
  };

  const filteredNotes = notes.filter(note => note.folder_id === selectedFolderId);

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    if (activeId.startsWith('note:')) {
      const noteId = activeId.replace('note:', '');
      const note = notes.find((n) => n.id === noteId) || null;
      setActiveNote(note);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setActiveNote(null);

    if (!overId || !activeId.startsWith('note:') || !overId.startsWith('folder:')) {
      return;
    }

    const noteId = activeId.replace('note:', '');
    const targetFolderId = overId === 'folder:unorganized' ? null : overId.replace('folder:', '');
    const note = notes.find((n) => n.id === noteId);
    if (!note || note.folder_id === targetFolderId) {
      return;
    }

    try {
      await notesApi.bulkMove([noteId], targetFolderId);
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, folder_id: targetFolderId } : n))
      );
      if (selectedNote?.id === noteId) {
        setSelectedNote({ ...note, folder_id: targetFolderId });
      }
    } catch (error) {
      showSnackbar('Failed to move note', 'error');
    }
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveNote(null)}
    >
      <Box sx={{ display: 'flex', height: '100vh', minHeight: 0, overflow: 'hidden' }}>
        <FolderSidebar
          notes={notes}
          selectedFolderId={selectedFolderId}
          onFolderSelect={setSelectedFolderId}
          onOrganize={handleOrganizeNotes}
        />
        <Box sx={{ width: 320, borderRight: 1, borderColor: 'divider', height: '100%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              size="small"
              placeholder="Search notes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {searchQuery ? (
              <SearchResults
                results={searchResults}
                onSelectResult={handleSelectSearchResult}
              />
            ) : (
              <NotesList
                notes={filteredNotes}
                selectedNoteId={selectedNote?.id || null}
                onSelectNote={setSelectedNote}
                searchQuery={searchQuery}
              />
            )}
          </Box>
        </Box>
        <NoteDetail
          note={selectedNote}
          onUpdate={handleUpdateNote}
          onApplyNote={applyNoteUpdate}
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

        <Dialog
          open={categoryDialog?.open || false}
          onClose={handleRejectCategory}
          title="New Category Discovered"
          actions={
            <>
              <Button onClick={handleRejectCategory}>Reject</Button>
              <Button onClick={handleApproveCategory} variant="contained">
                Approve
              </Button>
            </>
          }
        >
          <Typography variant="body1" gutterBottom>
            AI suggests a new category: <strong>{categoryDialog?.category}</strong>
          </Typography>
          {categoryDialog?.reasoning && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {categoryDialog.reasoning}
            </Typography>
          )}
        </Dialog>

        <OrganizeDialog
          open={organizeDialogOpen}
          onClose={() => {
            setOrganizeDialogOpen(false);
            setOrganizeSuggestions(null);
          }}
          onApply={handleApplyOrganization}
          suggestions={organizeSuggestions}
          loading={organizingNotes}
          notes={notes}
          folders={folders}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            severity={snackbar.severity}
            sx={{
              width: '100%',
              ...(snackbar.severity === 'error'
                ? {
                    bgcolor: theme.palette.error.main,
                    color: theme.palette.error.contrastText,
                    '& .MuiAlert-icon': { color: theme.palette.error.contrastText },
                  }
                : {}),
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>

      <DragOverlay>
        {activeNote ? (
          <Paper sx={{ p: 1.5, minWidth: 220 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {activeNote.title}
            </Typography>
          </Paper>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default NotesView;
