import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { Note, InspirationsGrouped } from '../types';
import { inspirationsApi } from '../services/api';

interface InspirationsViewProps {
  onNoteClick: (noteId: string) => void;
  initialSelectedCategory?: string | null;
}

const InspirationsView: React.FC<InspirationsViewProps> = ({ onNoteClick, initialSelectedCategory }) => {
  const [inspirations, setInspirations] = useState<InspirationsGrouped>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadInspirations();
  }, []);

  useEffect(() => {
    if (initialSelectedCategory) {
      setSelectedCategory(initialSelectedCategory);
    }
  }, [initialSelectedCategory]);

  const loadInspirations = async () => {
    try {
      const inspirations = await inspirationsApi.getAll();
      setInspirations(inspirations);
    } catch (error) {
      console.error('Failed to load inspirations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPreview = (body: string): string => {
    const firstLine = body.split('\n')[0].trim();
    return firstLine || 'No content';
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  const categories = Object.keys(inspirations);

  if (categories.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h6" color="text.secondary">
          No inspirations yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use "Categorize with AI" on your notes to create inspirations
        </Typography>
      </Box>
    );
  }

  const selectedItems = selectedCategory ? inspirations[selectedCategory] : [];

  return (
    <>
      <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Inspirations
        </Typography>

        {/* Dashboard grid of category cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 3 }}>
          {categories.map((category) => {
            const items = inspirations[category];
            return (
              <Card 
                key={category}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardActionArea 
                  onClick={() => setSelectedCategory(category)}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', p: 0 }}
                >
                  <CardContent sx={{ flexGrow: 1, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LightbulbIcon color="primary" />
                      <Typography variant="h6" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {category}
                      </Typography>
                    </Box>
                    
                    <Chip 
                      label={`${items.length} ${items.length === 1 ? 'item' : 'items'}`} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    
                    {/* Preview of first 2 items */}
                    <Box sx={{ mt: 2 }}>
                      {items.slice(0, 2).map((note) => (
                        <Typography
                          key={note.id}
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 0.5,
                          }}
                        >
                          • {note.title}
                        </Typography>
                      ))}
                      {items.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          +{items.length - 2} more
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </Box>

      {/* Dialog to show items in selected category */}
      <Dialog 
        open={selectedCategory !== null} 
        onClose={() => setSelectedCategory(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LightbulbIcon color="primary" />
            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
              {selectedCategory}
            </Typography>
          </Box>
          <IconButton onClick={() => setSelectedCategory(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <List>
            {selectedItems.map((note) => (
              <ListItemButton
                key={note.id}
                onClick={() => {
                  onNoteClick(note.id);
                  setSelectedCategory(null);
                }}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight={600}>
                      {note.title}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getPreview(note.body)}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InspirationsView;