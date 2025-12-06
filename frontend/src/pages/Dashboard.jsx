import React, { useEffect, useState } from 'react';
import { getRFPs } from '../api';
import { 
  Container, Typography, Card, CardContent, Button, Grid, Chip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [rfps, setRfps] = useState([]);
    const navigate = useNavigate();

    // The "useEffect" hook runs ONLY ONCE when the page loads
    useEffect(() => {
        // We define the async logic directly inside here to avoid hoisting errors
        const fetchData = async () => {
            try {
                console.log("Fetching RFPs..."); // Debug Log
                const data = await getRFPs();
                setRfps(data);
            } catch (error) {
                console.error("Failed to load RFPs", error);
            }
        };

        fetchData();
    }, []); // <--- THIS EMPTY ARRAY [] IS CRITICAL. DO NOT REMOVE IT.

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Typography variant="h4">My RFPs</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/create')}
                >
                    New RFP
                </Button>
            </div>

            <Grid container spacing={3}>
                {/* Show a message if list is empty */}
                {rfps.length === 0 && (
                    <Grid item xs={12}>
                        <Card variant="outlined" sx={{ bgcolor: '#f5f5f5' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">
                                    No RFPs found yet.
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Click "New RFP" to create your first one!
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Show the list */}
                {rfps.map((rfp) => (
                    <Grid item xs={12} key={rfp.id}>
                        <Card variant="outlined">
                            <CardContent>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <Typography variant="h6">{rfp.title}</Typography>
                                        <Typography color="text.secondary" variant="body2">
                                            ID: {rfp.id}
                                        </Typography>
                                    </div>
                                    <Chip label={rfp.status || "Open"} color="primary" size="small" />
                                </div>
                                <Button 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ mt: 2 }}
                                    onClick={() => navigate(`/rfp/${rfp.id}`)}
                                >
                                    View Proposals
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}

export default Dashboard;