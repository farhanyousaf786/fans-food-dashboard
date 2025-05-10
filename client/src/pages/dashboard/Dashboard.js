import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';

const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
                Welcome to Dashboard
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            User Information
                        </Typography>
                        <Typography variant="body1">
                            Name: {user?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body1">
                            Role: {user?.role || 'N/A'}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Quick Stats
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Stats will be displayed here
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;