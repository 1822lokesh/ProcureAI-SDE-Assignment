import React from 'react';
import { Button, Container, Typography, Card, CardContent } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

function App() {
  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Card sx={{ minWidth: 275, textAlign: 'center', padding: '20px' }}>
        <CardContent>
          <RocketLaunchIcon style={{ fontSize: 60, color: '#1976d2' }} />
          <Typography variant="h4" component="div" gutterBottom>
            ProcureAI
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Frontend is running successfully with Material UI!
          </Typography>
          <br />
          <Button variant="contained" color="primary">
            Ready for Phase 2
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}

export default App;
