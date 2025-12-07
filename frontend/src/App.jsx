import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme'; // Import the theme we created

import Dashboard from './pages/Dashboard';
import CreateRFP from './pages/CreateRFP'; 
import RFPDetails from './pages/RFPDetails'; 
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DashboardIcon from '@mui/icons-material/Dashboard';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* The Glassmorphism Header */}
        <AppBar position="sticky">
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              <AutoAwesomeIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, color: '#2563eb' }} />
              <Typography
                variant="h6"
                noWrap
                component="a"
                href="/"
                sx={{
                  mr: 2,
                  display: { xs: 'none', md: 'flex' },
                  fontFamily: 'Inter',
                  fontWeight: 700,
                  color: '#0f172a', // Dark text
                  textDecoration: 'none',
                  flexGrow: 1
                }}
              >
                ProcureAI
              </Typography>

              {/* Navigation */}
              <Box sx={{ flexGrow: 0 }}>
                <Button 
                  href="/" 
                  startIcon={<DashboardIcon />}
                  sx={{ 
                    color: '#64748b', 
                    fontWeight: 600, 
                    '&:hover': { color: '#2563eb', bgcolor: 'transparent' } 
                  }}
                >
                  Dashboard
                </Button>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
        
        {/* Main Content Area */}
        <Box sx={{ minHeight: '100vh', pb: 8, pt: 2 }}> 
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateRFP />} />
            <Route path="/rfp/:id" element={<RFPDetails />} /> 
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;