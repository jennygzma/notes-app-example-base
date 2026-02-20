import React, { useState } from 'react';
import { Box, Tabs, Tab, AppBar } from '@mui/material';
import NotesView from './components/NotesView';
import InspirationsView from './components/InspirationsView';
import PlannerView from './components/PlannerView';
import ChatWidget from './components/ChatWidget';

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleNavigateToNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setCurrentTab(0);
  };

  const handleNavigateToTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentTab(2);
  };

  const handleNavigateToInspiration = (category: string) => {
    setSelectedCategory(category);
    setCurrentTab(1);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Notes" />
          <Tab label="Inspirations" />
          <Tab label="Planner" />
        </Tabs>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {currentTab === 0 && (
          <NotesView 
            initialSelectedNoteId={selectedNoteId}
            onNavigateToTask={handleNavigateToTask}
            onNavigateToInspiration={handleNavigateToInspiration}
          />
        )}
        {currentTab === 1 && (
          <InspirationsView 
            onNoteClick={handleNavigateToNote}
            initialSelectedCategory={selectedCategory}
          />
        )}
        {currentTab === 2 && (
          <PlannerView 
            initialSelectedTaskId={selectedTaskId}
            onNavigateToNote={handleNavigateToNote}
          />
        )}
      </Box>

      <ChatWidget onNavigateToNote={handleNavigateToNote} />
    </Box>
  );
}

export default App;
