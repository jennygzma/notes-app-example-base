import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  List,
  ListItem,
  CircularProgress,
  Select,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Send as SendIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ChatSession, ChatMessage } from '../types';
import { chatApi } from '../services/api';
import ChatThinking from './ChatThinking';

interface ChatWidgetProps {
  onNavigateToNote: (noteId: string) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ onNavigateToNote }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const response = await chatApi.getSessions();
      setSessions(response.data);
      if (response.data.length > 0 && !currentSessionId) {
        setCurrentSessionId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await chatApi.getMessages(sessionId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleNewSession = async () => {
    try {
      const response = await chatApi.createSession();
      const newSession = response.data;
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSessionId || isLoading) return;

    const question = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatApi.query(currentSessionId, question);
      await loadMessages(currentSessionId);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <IconButton
        onClick={() => setIsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 80,
          bgcolor: 'primary.main',
          color: 'white',
          width: 60,
          height: 60,
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        }}
      >
        <ChatIcon />
      </IconButton>
    );
  }

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 80,
        width: 400,
        height: 600,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1300,
      }}
    >
      <Box
        sx={{
          p: 1,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Select
            value={currentSessionId || ''}
            onChange={(e) => setCurrentSessionId(e.target.value)}
            size="small"
            sx={{
              color: 'white',
              flex: 1,
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
              '.MuiSvgIcon-root': { color: 'white' },
            }}
          >
            {sessions.map((session) => (
              <MenuItem key={session.id} value={session.id}>
                {session.title}
              </MenuItem>
            ))}
          </Select>
          <IconButton size="small" onClick={handleNewSession} sx={{ color: 'white' }}>
            <AddIcon />
          </IconButton>
        </Box>
        <Box>
          <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
            <MinimizeIcon />
          </IconButton>
          <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Start a conversation by asking a question about your notes
            </Typography>
          </Box>
        )}
        {messages.map((message) => (
          <ListItem
            key={message.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              p: 0,
              mb: 2,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                maxWidth: '80%',
                bgcolor: message.role === 'user' ? 'primary.main' : 'white',
                color: message.role === 'user' ? 'white' : 'text.primary',
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </Typography>

              {message.role === 'assistant' && message.thinking && (
                <ChatThinking
                  thinking={message.thinking}
                  onNoteClick={onNavigateToNote}
                />
              )}

              {message.role === 'assistant' && message.referenced_note_ids && message.referenced_note_ids.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {message.referenced_note_ids.map((noteId) => (
                    <Chip
                      key={noteId}
                      label="Referenced Note"
                      size="small"
                      onClick={() => onNavigateToNote(noteId)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              )}
            </Paper>
          </ListItem>
        ))}
        {isLoading && (
          <ListItem sx={{ justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </ListItem>
        )}
        <div ref={messagesEndRef} />
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'white' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask about your notes..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !currentSessionId}
            multiline
            maxRows={3}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !currentSessionId}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatWidget;