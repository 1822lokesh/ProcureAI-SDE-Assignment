import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import { CssBaseline, AppBar, Toolbar, Typography } from '@mui/material';

function App() {
  return (
    <Router>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">ProcureAI 🤖</Typography>
        </Toolbar>
      </AppBar>
      
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<div>Create Page Coming Soon</div>} />
        <Route path="/rfp/:id" element={<div>Details Page Coming Soon</div>} />
      </Routes>
    </Router>
  );
}

export default App;