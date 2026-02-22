import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';
import { ChatMessage, Note } from '../../types';
import { chatApi, notesApi } from '../../services/api';

interface ChatViewProps {
  onNavigateToNote?: (noteId: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onNavigateToNote }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadNotes = async () => {
    try {
      const loadedNotes = await notesApi.getAll();
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Failed to load notes', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.send(input);
      
      const citedNotes = notes.filter(n => response.cited_note_ids.includes(n.id));
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        reasoning: response.reasoning,
        citations: citedNotes.map(note => ({
          note_id: note.id,
          note_title: note.title,
          excerpt: note.body.substring(0, 150) + '...',
        })),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Chat with Your Notes
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Ask questions and I'll find relevant information from your notes
      </Typography>

      <Box sx={{ flex: 1, overflowY: 'auto', my: 2 }}>
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Start a conversation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try asking: "How do I deploy a Flask app?" or "What are my project ideas?"
            </Typography>
          </Box>
        )}

        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </Typography>

              {message.role === 'assistant' && message.reasoning && (
                <Accordion sx={{ mt: 2, bgcolor: 'transparent', boxShadow: 'none' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="caption">Show Reasoning</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="caption" display="block" gutterBottom>
                      <strong>Folder Selection:</strong> {message.reasoning.folder_selection}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {message.reasoning.folders_searched.map((folder) => (
                        <Chip
                          key={folder.id}
                          icon={<FolderIcon />}
                          label={folder.name}
                          size="small"
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Searched {message.reasoning.notes_searched} notes
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}

              {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    <strong>Sources:</strong>
                  </Typography>
                  <List dense>
                    {message.citations.map((citation) => (
                      <ListItem key={citation.note_id} disablePadding>
                        <ListItemButton onClick={() => onNavigateToNote?.(citation.note_id)}>
                          <ArticleIcon fontSize="small" sx={{ mr: 1 }} />
                          <ListItemText
                            primary={citation.note_title}
                            secondary={citation.excerpt}
                            secondaryTypographyProps={{ noWrap: true }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Thinking...</Typography>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask a question about your notes..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!input.trim() || loading}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatView;