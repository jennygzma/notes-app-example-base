import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import { aiApi } from '../../services/api';
import { FeedbackResponse } from '../../types';

interface LLMFeedbackPanelProps {
  selectedText: string;
  onApplyRewrite: (rewrite: string) => void;
  onClose: () => void;
}

export const LLMFeedbackPanel: React.FC<LLMFeedbackPanelProps> = ({
  selectedText,
  onApplyRewrite,
  onClose,
}) => {
  const [feedbackType, setFeedbackType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FeedbackResponse | null>(null);

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

  const handleApply = () => {
    if (result?.suggested_rewrite) {
      onApplyRewrite(result.suggested_rewrite);
      onClose();
    }
  };

  return (
    <Box
      sx={{
        width: 400,
        height: '100%',
        borderLeft: 1,
        borderColor: 'divider',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">AI Feedback</Typography>
        <Button onClick={onClose} variant="text" size="small">
          Close
        </Button>
      </Box>

      <Box
        sx={{
          p: 2,
          bgcolor: 'action.hover',
          borderRadius: 1,
          maxHeight: 150,
          overflow: 'auto',
        }}
      >
        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
          {selectedText}
        </Typography>
      </Box>

      <TextField
        label="Feedback Type"
        placeholder="e.g., grammar, clarity, tone, brevity"
        value={feedbackType}
        onChange={(e) => setFeedbackType(e.target.value)}
        disabled={loading}
      />

      <Button onClick={handleGetFeedback} disabled={loading || !feedbackType.trim()}>
        {loading ? <CircularProgress size={20} /> : 'Get Feedback'}
      </Button>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Feedback:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {result.feedback}
            </Typography>
          </Box>

          {result.suggested_rewrite && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Suggested Rewrite:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {result.suggested_rewrite}
                </Typography>
              </Box>
              <Button onClick={handleApply} variant="contained">
                Apply Rewrite
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};