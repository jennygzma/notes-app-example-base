import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { chatApi } from '../../services/api';
import ReasoningPanel from './ReasoningPanel';
import CitationCard from './CitationCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: any;
}

interface ChatViewProps {
  onNavigateToNote?: (noteId: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onNavigateToNote }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lastReasoning, setLastReasoning] = useState<any>(null);
  const [lastCitations, setLastCitations] = useState<any[]>([]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const result = await chatApi.sendMessage(userMessage, conversationId || undefined);
      
      if (!conversationId) {
        setConversationId(result.conversation_id);
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: result.answer,
          timestamp: new Date().toISOString(),
          metadata: result.reasoning,
        },
      ]);

      setLastReasoning(result.reasoning);
      setLastCitations(result.citations || []);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your message.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Chat with Your Notes</Typography>
          <Typography variant="body2" color="text.secondary">
            Ask questions and I'll search your notes to find answers
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                Start a conversation by asking a question about your notes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Example: "What are my app ideas?" or "How do I deploy a Flask app?"
              </Typography>
            </Box>
          )}

          {messages.map((message, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
            </Paper>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Thinking...
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Ask a question..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              multiline
              maxRows={4}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Box sx={{ width: 400, borderLeft: 1, borderColor: 'divider', overflow: 'auto' }}>
        {lastReasoning && (
          <ReasoningPanel reasoning={lastReasoning} />
        )}
        
        {lastCitations.length > 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Citations
            </Typography>
            {lastCitations.map((citation, index) => (
              <CitationCard
                key={index}
                citation={citation}
                onNavigateToNote={onNavigateToNote}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatView;