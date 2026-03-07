import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import TextField from '../../components/design-system/TextField';
import Button from '../../components/design-system/Button';
import { aiApi } from '../../services/api';

interface LLMFeedbackPanelProps {
  selectedText: string;
  onApplyRewrite: (rewrittenText: string) => void;
  onClose: () => void;
}

export const LLMFeedbackPanel: React.FC<LLMFeedbackPanelProps> = ({
  selectedText,
  onApplyRewrite,
  onClose,
}) => {
  const [feedbackType, setFeedbackType] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [suggestedRewrite, setSuggestedRewrite] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetFeedback = async () => {
    if (!feedbackType.trim()) {
      setError('Please enter a feedback type');
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);
    setSuggestedRewrite(null);

    try {
      const result = await aiApi.provideFeedback({
        selected_text: selectedText,
        feedback_type: feedbackType,
      });

      setFeedback(result.feedback);
      setSuggestedRewrite(result.suggested_rewrite);
    } catch (err: any) {
      setError(err.message || 'Failed to get feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRewrite = () => {
    if (suggestedRewrite) {
      onApplyRewrite(suggestedRewrite);
      onClose();
    }
  };

  return (
    <Box
      sx={{
        width: 350,
        height: '100%',
        borderLeft: 1,
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">AI Feedback</Typography>
        <Button size="small" onClick={onClose}>
          Close
        </Button>
      </Box>

      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Selected Text:
        </Typography>
        <Typography variant="body2" sx={{ fontStyle: 'italic', maxHeight: 100, overflow: 'auto' }}>
          {selectedText}
        </Typography>
      </Box>

      <TextField
        label="Feedback Type"
        placeholder="e.g., grammar, clarity, tone, conciseness"
        value={feedbackType}
        onChange={(e) => setFeedbackType(e.target.value)}
        disabled={loading}
      />

      <Button
        onClick={handleGetFeedback}
        disabled={loading || !feedbackType.trim()}
        fullWidth
      >
        {loading ? <CircularProgress size={24} /> : 'Get Feedback'}
      </Button>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {feedback && (
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Feedback:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {feedback}
            </Typography>
          </Box>

          {suggestedRewrite && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Suggested Rewrite:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  mb: 1,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {suggestedRewrite}
                </Typography>
              </Box>
              <Button onClick={handleApplyRewrite} fullWidth>
                Apply Rewrite
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};