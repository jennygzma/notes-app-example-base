import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TextField from '../../components/design-system/TextField';
import Button from '../../components/design-system/Button';
import ReasoningPanel from './ReasoningPanel';
import CitationCard from './CitationCard';
import { chatApi } from '../../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    citations?: any[];
    confidence?: number;
    notes_searched?: number;
  };
}

interface ChatViewProps {
  onNavigateToNote?: (noteId: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onNavigateToNote }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoadingHistory(true);
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectConversation = async (id: string) => {
    try {
      const conversation = await chatApi.getConversation(id);
      setConversationId(conversation.id);
      setMessages(conversation.messages || []);
      setReasoning(null);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await chatApi.deleteConversation(id);
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
        setReasoning(null);
      }
      loadConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.sendMessage(input.trim(), conversationId || undefined);
      
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        metadata: {
          citations: response.citations,
          confidence: response.confidence,
          notes_searched: response.reasoning?.notes_searched,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      setReasoning(response.reasoning);
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setReasoning(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box sx={{ width: 280, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Chat History</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={handleNewConversation}
            size="small"
            sx={{ mt: 1 }}
            fullWidth
          >
            New Chat
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loadingHistory ? (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <List dense>
              {conversations.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No conversations yet"
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
              )}
              {conversations.map((conv: any) => {
                const lastMessage = conv.messages?.[conv.messages.length - 1];
                const preview = lastMessage?.content || 'New conversation';
                return (
                  <React.Fragment key={conv.id}>
                    <ListItemButton
                      selected={conversationId === conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      sx={{ alignItems: 'flex-start' }}
                    >
                      <ListItemText
                        primary={preview}
                        secondary={new Date(conv.updated_at).toLocaleString()}
                        primaryTypographyProps={{
                          variant: 'body2',
                          noWrap: true,
                        }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                        aria-label="Delete conversation"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">Chat with Your Notes</Typography>
          <Button onClick={loadConversations} size="small" variant="outlined">
            Refresh
          </Button>
        </Box>

        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {messages.length === 0 && (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2
            }}>
              <Typography variant="h5" color="text.secondary">
                Ask me anything about your notes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                I'll search your folders and provide grounded answers with citations
              </Typography>
            </Box>
          )}

          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  backgroundColor: message.role === 'user' ? 'primary.main' : 'background.paper',
                  color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
                {message.metadata?.citations && message.metadata.citations.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                      Sources:
                    </Typography>
                    <List dense>
                      {message.metadata.citations.map((citation: any, i: number) => (
                        <ListItem key={i} sx={{ p: 0 }}>
                          <CitationCard
                            citation={citation}
                            onOpenNote={onNavigateToNote}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Paper>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Searching your notes...
                </Typography>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Ask a question about your notes..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              multiline
              maxRows={4}
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
      </Box>

      {reasoning && (
        <ReasoningPanel reasoning={reasoning} />
      )}
    </Box>
  );
};

export default ChatView;
