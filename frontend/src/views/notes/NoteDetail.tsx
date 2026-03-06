import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Stack,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryIcon from '@mui/icons-material/History';
import EmailIcon from '@mui/icons-material/Email';
import { Note, PlannerItem, NoteVersion, DiffChunk } from '../../types';
import { notesApi } from '../../services/api';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import Tag from '../../components/design-system/Tag';
import InlineConfirmButton from '../../components/shared/InlineConfirmButton';
import VersionHistoryPanel from './VersionHistoryPanel';
import VersionCompareView from './VersionCompareView';
import DiffViewer from './DiffViewer';
import { LLMFeedbackPanel } from './LLMFeedbackPanel';
import { SendEmailDialog } from './SendEmailDialog';

interface NoteDetailProps {
  note: Note | null;
  onUpdate: (id: string, title: string, body: string) => Promise<void>;
  onApplyNote: (note: Note) => void;
  onDelete: (id: string) => Promise<void>;
  onCategorize: (noteId: string) => Promise<void>;
  onConvertToTask: (noteId: string) => Promise<void>;
  linkedItems: PlannerItem[];
  onNavigateToItem: (item: PlannerItem) => void;
  inspirationCategory?: string | null;
  onNavigateToInspiration?: (category: string) => void;
  categorizingNoteId: string | null;
  translatingNoteId: string | null;
}

const NoteDetail: React.FC<NoteDetailProps> = ({
  note,
  onUpdate,
  onApplyNote,
  onDelete,
  onCategorize,
  onConvertToTask,
  linkedItems,
  onNavigateToItem,
  inspirationCategory,
  onNavigateToInspiration,
  categorizingNoteId,
  translatingNoteId,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [diffs, setDiffs] = useState<DiffChunk[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setHasChanges(false);
      setShowHistory(false);
      setSelectedVersion(null);
      setShowDiff(false);
    }
  }, [note]);

  const loadVersions = async () => {
    if (!note) return;
    try {
      const vers = await notesApi.getVersions(note.id);
      setVersions(vers);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const handleShowHistory = async () => {
    setShowHistory(!showHistory);
    if (!showHistory && note) {
      await loadVersions();
    }
  };

  const handleSelectVersion = async (version: NoteVersion) => {
    setSelectedVersion(version);
    setShowDiff(false);
  };

  const handleSeeDiff = async () => {
    if (!note || !selectedVersion) return;
    try {
      const diffData = await notesApi.getDiff(note.id, selectedVersion.id);
      setDiffs(diffData);
      setShowDiff(true);
    } catch (error) {
      console.error('Failed to load diff:', error);
    }
  };

  const handleRevertFull = async () => {
    if (!note || !selectedVersion) return;
    try {
      const updated = await notesApi.revertToVersion(note.id, { version_id: selectedVersion.id });
      onApplyNote(updated);
      setTitle(updated.title);
      setBody(updated.body);
      setHasChanges(false);
      setShowHistory(false);
      setSelectedVersion(null);
      setShowDiff(false);
    } catch (error) {
      console.error('Failed to revert:', error);
    }
  };

  const handleRevertParagraph = async (paragraphIndex: number) => {
    if (!note || !selectedVersion) return;
    try {
      const updated = await notesApi.revertToVersion(note.id, {
        version_id: selectedVersion.id,
        paragraph_indices: [paragraphIndex],
      });
      onApplyNote(updated);
      setTitle(updated.title);
      setBody(updated.body);
      setHasChanges(false);
      setShowDiff(false);
      setSelectedVersion(null);
    } catch (error) {
      console.error('Failed to revert paragraph:', error);
    }
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasChanges(true);
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (note && hasChanges) {
      await onUpdate(note.id, title, body);
      setHasChanges(false);
      if (showHistory) {
        await loadVersions();
      }
    }
  };

  const handleCategorize = async () => {
    if (note) {
      await onCategorize(note.id);
    }
  };

  const handleConvertToTask = async () => {
    if (note) {
      await onConvertToTask(note.id);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString());
    }
  };

  const handleGetFeedback = () => {
    if (selectedText.trim().length > 0) {
      setShowFeedback(true);
    }
  };

  const handleApplyRewrite = (newText: string) => {
    const oldText = selectedText;
    const updatedBody = body.replace(oldText, newText);
    setBody(updatedBody);
    setHasChanges(true);
    setSelectedText('');
    setShowFeedback(false);
  };

  const handleCloseFeedback = () => {
    setShowFeedback(false);
    setSelectedText('');
  };

  const handleEmailSuccess = async () => {
    if (note) {
      const updated = await notesApi.getById(note.id);
      onApplyNote(updated);
    }
  };

  if (!note) {
    return (
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography color="text.secondary">
          Select a note or create a new one
        </Typography>
      </Box>
    );
  }

  const isCategorizing = categorizingNoteId === note.id;
  const isTranslating = translatingNoteId === note.id;
  const emailSentActivity = note.activity_history.find(a => a.type === 'email_sent');

  return (
    <Box sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<HistoryIcon />}
          onClick={handleShowHistory}
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={(isCategorizing || isTranslating) ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
          onClick={handleCategorize}
          disabled={isCategorizing || isTranslating}
        >
          Link to Inspirations Dashboard
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<EmailIcon />}
          onClick={() => setShowEmailDialog(true)}
        >
          Send as Email
        </Button>
        {hasChanges && (
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
          >
            Save
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <InlineConfirmButton
          onConfirm={() => onDelete(note.id)}
        />
      </Box>

      {(linkedItems.length > 0 || inspirationCategory || emailSentActivity) && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          {linkedItems.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Linked to:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: (inspirationCategory || emailSentActivity) ? 2 : 0 }}>
                {linkedItems.map((item) => (
                  <Tag
                    key={item.id}
                    label={item.title}
                    onClick={() => onNavigateToItem(item)}
                  />
                ))}
              </Stack>
            </>
          )}
          {inspirationCategory && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Category:
              </Typography>
              <Tag
                label={inspirationCategory}
                color="primary"
                onClick={() => onNavigateToInspiration?.(inspirationCategory)}
                sx={{ textTransform: 'capitalize', mb: emailSentActivity ? 2 : 0 }}
              />
            </>
          )}
          {emailSentActivity && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Email Status:
              </Typography>
              <Tag
                label={`✉️ Sent ${new Date(emailSentActivity.timestamp).toLocaleDateString()}`}
                color="primary"
              />
            </>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {selectedVersion && !showDiff ? (
            <VersionCompareView
              currentNote={note}
              version={selectedVersion}
              onSeeDiff={handleSeeDiff}
              onRevert={handleRevertFull}
            />
          ) : showDiff && diffs.length > 0 ? (
            <DiffViewer
              diffs={diffs}
              onRevertParagraph={handleRevertParagraph}
            />
          ) : (
            <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
              <TextField
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Title"
                variant="standard"
                sx={{ 
                  mb: 2,
                  '& .MuiInput-root': {
                    fontSize: '1.5rem',
                    fontWeight: 600,
                  }
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <TextField
                  multiline
                  value={body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  onMouseUp={handleTextSelection}
                  placeholder="Start typing..."
                  variant="standard"
                  sx={{
                    '& .MuiInput-root': {
                      fontSize: '1rem',
                    }
                  }}
                />
                {selectedText && !showFeedback && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleGetFeedback}
                    sx={{
                      position: 'absolute',
                      top: -40,
                      right: 0,
                      zIndex: 10,
                    }}
                  >
                    Get AI Feedback
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
        {showHistory && (
          <VersionHistoryPanel
            versions={versions}
            selectedVersionId={selectedVersion?.id || null}
            onSelectVersion={handleSelectVersion}
          />
        )}
      </Box>
      {showFeedback && (
        <LLMFeedbackPanel
          selectedText={selectedText}
          onApplyRewrite={handleApplyRewrite}
          onClose={handleCloseFeedback}
        />
      )}
      <SendEmailDialog
        open={showEmailDialog}
        note={note}
        onClose={() => setShowEmailDialog(false)}
        onSuccess={handleEmailSuccess}
      />
    </Box>
  );
};

export default NoteDetail;
