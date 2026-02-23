import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import TextField from '../../components/design-system/TextField';
import Button from '../../components/design-system/Button';
import { chatApi } from '../../services/api';
import { ChatMessage, ChatResponse } from '../../types';

interface ChatViewProps {
  onOpenNote: (noteId: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onOpenNote }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.sendMessage({
        message: input,
        conversation_id: conversationId
      });

      setConversationId(response.conversation_id);
      setLastResponse(response);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        metadata: {
          reasoning: response.reasoning,
          citations: response.citations.map(c => c.note_id),
          has_complete_answer: response.has_complete_answer,
          confidence: response.confidence
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Chat
        </Typography>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {messages.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Typography variant="h6" color="text.secondary">
                Ask me anything about your notes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                I'll search through your organized notes to find the answer
              </Typography>
            </Box>
          )}

          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                p: 2,
                borderRadius: 2,
                bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                color: message.role === 'user' ? 'white' : 'text.primary'
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </Typography>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Thinking...
              </Typography>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your notes..."
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            sx={{ minWidth: 100 }}
          >
            Send
          </Button>
        </Box>
      </Box>

      {lastResponse && (
        <Box sx={{ width: 400 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Reasoning
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Searched {lastResponse.reasoning.notes_searched} notes across {lastResponse.reasoning.folders_selected.length} folders
            </Typography>
          </Box>
          
          {lastResponse.citations.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Citations
              </Typography>
              {lastResponse.citations.map((citation) => (
                <Box
                  key={citation.note_id}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: 1,
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'grey.50' }
                  }}
                  onClick={() => onOpenNote(citation.note_id)}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {citation.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {citation.excerpt}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ChatView;