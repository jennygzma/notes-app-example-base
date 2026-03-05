import React, { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloseIcon from '@mui/icons-material/Close';
import Button from '../../components/design-system/Button';
import TextField from '../../components/design-system/TextField';
import { aiApi } from '../../services/api';
import { FeedbackResponse } from '../../types';

interface LLMFeedbackPanelProps {
  selectedText: string;
  onApplyRewrite: (rewrittenText: string) => void;
  onClose: () => void;
}

const LLMFeedbackPanel: React.FC<LLMFeedbackPanelProps> = ({
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
      setError('Please specify what kind of feedback you want');
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
    } catch (err) {
      setError('Failed to get feedback. Please try again.');
      console.error('Feedback error:', err);
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
        width: 350,
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">AI Feedback</Typography>
        <Button size="small" onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </Box>

      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selected text ({selectedText.length} characters)
        </Typography>

        <TextField
          value={feedbackType}
          onChange={(e) => setFeedbackType(e.target.value)}
          placeholder="What kind of feedback? (e.g., improve clarity, check grammar, make professional)"
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          onClick={handleGetFeedback}
          disabled={loading || !feedbackType.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
          sx={{ mb: 2 }}
        >
          {loading ? 'Getting Feedback...' : 'Get Feedback'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Feedback:
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
              {result.feedback}
            </Typography>

            {result.suggested_rewrite && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Suggested Rewrite:
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <Typography variant="body2">{result.suggested_rewrite}</Typography>
                </Box>

                <Button variant="contained" onClick={handleApply}>
                  Apply Rewrite
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LLMFeedbackPanel;
