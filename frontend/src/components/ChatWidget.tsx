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
  Fab,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import MinimizeIcon from '@mui/icons-material/Minimize';
import { ChatSession, ChatMessage } from '../types';
import { chatApi } from '../services/api';
import ChatThinking from './ChatThinking';
import colors from '../design-system/colors';

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

  const handleNewChat = async () => {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isOpen) {
    return (
      <Fab
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          bgcolor: colors.blue,
          '&:hover': { bgcolor: colors.blue },
        }}
        onClick={() => setIsOpen(true)}
      >
        <ChatIcon />
      </Fab>
    );
  }

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 400,
        height: 600,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1300,
      }}
    >
      <Box
        sx={{
          p: 2,
          bgcolor: colors.blue,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Select
          value={currentSessionId || ''}
          onChange={(e) => setCurrentSessionId(e.target.value)}
          size="small"
          sx={{
            flex: 1,
            bgcolor: 'white',
            '& .MuiSelect-select': { py: 0.5 },
          }}
        >
          {sessions.map((session) => (
            <MenuItem key={session.id} value={session.id}>
              {session.title}
            </MenuItem>
          ))}
        </Select>
        <IconButton size="small" onClick={handleNewChat} sx={{ color: 'white' }}>
          <AddIcon />
        </IconButton>
        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
          <MinimizeIcon />
        </IconButton>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((message) => (
          <ListItem
            key={message.id}
            sx={{
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              p: 0,
              mb: 2,
            }}
          >
            <Paper
              sx={{
                p: 1.5,
                maxWidth: '80%',
                bgcolor: message.role === 'user' ? colors.blue : colors.grey,
                color: 'white',
              }}
            >
              <Typography variant="body2">{message.content}</Typography>
            </Paper>

            {message.role === 'assistant' && message.thinking && (
              <Box sx={{ mt: 1, width: '100%' }}>
                <ChatThinking
                  thinking={message.thinking}
                  onNoteClick={onNavigateToNote}
                />
              </Box>
            )}

            {message.role === 'assistant' && message.referenced_note_ids && message.referenced_note_ids.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {message.referenced_note_ids.map((noteId) => (
                  <Button
                    key={noteId}
                    size="small"
                    variant="outlined"
                    onClick={() => onNavigateToNote(noteId)}
                  >
                    View Note
                  </Button>
                ))}
              </Box>
            )}
          </ListItem>
        ))}
        {isLoading && (
          <ListItem sx={{ justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </ListItem>
        )}
        <div ref={messagesEndRef} />
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask about your notes..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading || !currentSessionId}
            multiline
            maxRows={3}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={isLoading || !currentSessionId || !inputValue.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatWidget;