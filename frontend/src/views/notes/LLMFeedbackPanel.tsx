import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import { aiApi } from '../../services/api';
import { FeedbackResponse } from '../../types';

interface LLMFeedbackPanelProps {
  selectedText: string;
  onApplyRewrite: (newText: string) => void;
  onClose: () => void;
}

export const LLMFeedbackPanel: React.FC<LLMFeedbackPanelProps> = ({
  selectedText,
  onApplyRewrite,
  onClose,
}) => {
  const [feedbackType, setFeedbackType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeedbackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetFeedback = async () => {
    if (!feedbackType.trim()) {
      setError('Please enter a feedback type');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await aiApi.provideFeedback({
        selected_text: selectedText,
        feedback_type: feedbackType,
      });
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to get feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRewrite = () => {
    if (result?.suggested_rewrite) {
      onApplyRewrite(result.suggested_rewrite);
      onClose();
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 0,
        top: 64,
        width: 400,
        height: 'calc(100vh - 64px)',
        bgcolor: 'background.paper',
        borderLeft: 1,
        borderColor: 'divider',
        p: 3,
        overflowY: 'auto',
        zIndex: 1000,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">AI Feedback</Typography>
        <Button onClick={onClose} variant="text">
          Close
        </Button>
      </Box>

      <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Selected Text:
        </Typography>
        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
          {selectedText.slice(0, 200)}
          {selectedText.length > 200 ? '...' : ''}
        </Typography>
      </Box>

      <TextField
        label="Feedback Type"
        value={feedbackType}
        onChange={(e) => setFeedbackType(e.target.value)}
        placeholder="e.g., grammar, clarity, tone, conciseness"
        sx={{ mb: 2 }}
        disabled={loading}
      />

      <Button
        onClick={handleGetFeedback}
        disabled={loading || !feedbackType.trim()}
        sx={{ mb: 3 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Get Feedback'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Feedback:
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {result.feedback}
          </Typography>

          {result.suggested_rewrite && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Suggested Rewrite:
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {result.suggested_rewrite}
                </Typography>
              </Box>
              <Button onClick={handleApplyRewrite} color="primary">
                Apply Rewrite
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};