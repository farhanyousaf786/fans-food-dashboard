import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, Divider, useTheme, Paper } from '@mui/material';
import { Store, LocationOn, AccessTime, MeetingRoom, Restaurant } from '@mui/icons-material';

const Profile = () => {
    const theme = useTheme();
    const [shopData, setShopData] = useState(null);

    useEffect(() => {
        const savedShopData = localStorage.getItem('currentShopData');
        if (savedShopData) {
            setShopData(JSON.parse(savedShopData));
        }
    }, []);

    return (
        <Box sx={{ 
          
        }}>
            {shopData ? (
                <Card 
                    elevation={1}
                    sx={{ 
                        width: '100%',
                        maxWidth: '800px',
                        p: 4, 
                        borderRadius: '12px',
                        boxShadow: 'none'
                    }}
                >
                    {/* Shop Name and Icon */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Restaurant sx={{ fontSize: 56, color: theme.palette.primary.main, mb: 2 }} />
                        <Typography variant="h4" fontWeight="500" color="#333">
                            {shopData.name}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            {shopData.stadiumName}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    {/* Location Info */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#555', fontWeight: '500' }}>
                            Location Details
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOn sx={{ color: theme.palette.primary.main, mr: 2 }} />
                                <Typography sx={{ color: theme.palette.text.secondary }}>{shopData.location}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <MeetingRoom sx={{ color: theme.palette.primary.main, mr: 2 }} />
                                <Typography sx={{ color: theme.palette.text.secondary }}>Gate {shopData.gate}, Floor {shopData.floor}</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Shop Description */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#555', fontWeight: '500' }}>
                            About Shop
                        </Typography>
                        <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                            {shopData.description || 'No description available'}
                        </Typography>
                    </Box>

                    {/* Created Date */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AccessTime sx={{ color: theme.palette.primary.main, mr: 1 }} />
                        <Typography color="text.secondary">
                            Created on {new Date(shopData.createdAt).toLocaleDateString()}
                        </Typography>
                    </Box>
                </Card>
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Typography variant="h5" color="text.secondary">
                        No shop selected. Please select a shop from the shop panel.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default Profile;
