import React, { useState } from 'react';
import { 
    Container, Typography, TextField, Button, Paper, CircularProgress, Alert 
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Magic Icon
import { createRFP } from '../api';
import { useNavigate } from 'react-router-dom';

function CreateRFP() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (!prompt) return;
        
        setLoading(true);
        setError(null);

        try {
            // 1. Send text to Backend AI
            await createRFP(prompt);
            
            // 2. Redirect to Dashboard on success
            navigate('/'); 
        } catch (err) {
            console.error(err);
            setError("Failed to create RFP. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon color="primary" /> 
                    Create Intelligent RFP
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                    Describe what you want to buy. Our AI will automatically define the requirements and data structure for you.
                </Typography>

                <TextField
                    label="What do you need?"
                    multiline
                    rows={4}
                    fullWidth
                    variant="outlined"
                    placeholder="E.g. I need 50 Ergonomic Office Chairs. Budget is $150 each. Must have lumbar support."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 3 }}
                />

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Button 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    onClick={handleSubmit}
                    disabled={loading || !prompt}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                >
                    {loading ? "AI is Thinking..." : "Generate RFP"}
                </Button>
            </Paper>
        </Container>
    );
}

export default CreateRFP;