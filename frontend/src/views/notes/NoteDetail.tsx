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
import { Note, PlannerItem, NoteVersion, DiffChunk, NoteActivity, SendEmailResponse } from '../../types';
import { notesApi } from '../../services/api';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import Tag from '../../components/design-system/Tag';
import InlineConfirmButton from '../../components/shared/InlineConfirmButton';
import Dialog from '../../components/shared/Dialog';
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
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [emailDetailsOpen, setEmailDetailsOpen] = useState(false);
  const [emailActivities, setEmailActivities] = useState<NoteActivity[]>([]);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setHasChanges(false);
      setShowHistory(false);
      setSelectedVersion(null);
      setShowDiff(false);
      setEmailActivities(note.activity_history || []);
      setSendEmailOpen(false);
      setEmailDetailsOpen(false);
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
    const text = selection?.toString() || '';
    if (text.trim()) {
      setSelectedText(text);
      setShowFeedbackPanel(true);
    }
  };

  const handleApplyRewrite = (rewrite: string) => {
    if (!selectedText) return;
    const newBody = body.replace(selectedText, rewrite);
    setBody(newBody);
    setHasChanges(true);
    setSelectedText('');
  };

  const handleEmailSentSuccess = (
    result: SendEmailResponse,
    recipient: string,
    subject: string
  ) => {
    const sentAt = result.sent_at;
    setEmailActivities((prev) => [
      ...prev,
      {
        type: 'email_sent',
        timestamp: sentAt,
        details: {
          recipient,
          subject,
          message_id: result.message_id,
          sent_at: sentAt,
        },
      },
    ]);
  };

  const getLatestEmailActivity = (activities: NoteActivity[]) => {
    const emailActivitiesList = activities.filter((activity) => activity.type === 'email_sent');
    if (emailActivitiesList.length === 0) return null;
    return emailActivitiesList.reduce((latest, current) => {
      const latestTime = new Date(latest.timestamp).getTime();
      const currentTime = new Date(current.timestamp).getTime();
      return currentTime > latestTime ? current : latest;
    });
  };

  const latestEmailActivity = getLatestEmailActivity(emailActivities);
  const emailDetails = latestEmailActivity?.details || {};

  const formatEmailDate = (timestamp: string) =>
    new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatEmailTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

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
          onClick={handleTextSelection}
        >
          Get AI Feedback
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<EmailIcon />}
          color="secondary"
          onClick={() => setSendEmailOpen(true)}
        >
          Send Email
        </Button>
        {latestEmailActivity && (
          <Tag
            label={`Email sent on ${formatEmailDate(latestEmailActivity.timestamp)}`}
            variant="outlined"
            icon={<EmailIcon fontSize="small" />}
            color="secondary"
            onClick={() => setEmailDetailsOpen(true)}
          />
        )}
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

      {(linkedItems.length > 0 || inspirationCategory) && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          {linkedItems.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Linked to:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: inspirationCategory ? 2 : 0 }}>
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
                sx={{ textTransform: 'capitalize' }}
              />
            </>
          )}
        </Box>
      )}

      {latestEmailActivity && (
        <Dialog
          open={emailDetailsOpen}
          onClose={() => setEmailDetailsOpen(false)}
          title="Email Details"
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">
              <strong>Recipient:</strong> {emailDetails.recipient || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>Subject:</strong> {emailDetails.subject || note.title}
            </Typography>
            <Typography variant="body2">
              <strong>Sent:</strong>{' '}
              {latestEmailActivity?.timestamp
                ? `${formatEmailDate(latestEmailActivity.timestamp)} at ${formatEmailTime(
                    latestEmailActivity.timestamp
                  )}`
                : 'Unknown'}
            </Typography>
            {emailDetails.message_id && (
              <Typography variant="body2">
                <strong>Message ID:</strong> {emailDetails.message_id}
              </Typography>
            )}
          </Box>
        </Dialog>
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
              <TextField
                multiline
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Start typing..."
                variant="standard"
                sx={{
                  '& .MuiInput-root': {
                    fontSize: '1rem',
                  }
                }}
              />
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
        {showFeedbackPanel && selectedText && (
          <LLMFeedbackPanel
            selectedText={selectedText}
            onApplyRewrite={handleApplyRewrite}
            onClose={() => {
              setShowFeedbackPanel(false);
              setSelectedText('');
            }}
          />
        )}
        <SendEmailDialog
          open={sendEmailOpen}
          note={note}
          onClose={() => setSendEmailOpen(false)}
          onSuccess={handleEmailSentSuccess}
        />
      </Box>
    </Box>
  );
};

export default NoteDetail;
