import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Card, Divider } from '@mui/material';
import { Store, LocationOn, AccessTime, MeetingRoom } from '@mui/icons-material';

const Dashboard = () => {
    const location = useLocation();
    const [shopData, setShopData] = useState(null);

    useEffect(() => {
        if (location.state?.shopData) {
            setShopData(location.state.shopData);
            localStorage.setItem('currentShopData', JSON.stringify(location.state.shopData));
        } else {
            const savedShopData = localStorage.getItem('currentShopData');
            if (savedShopData) {
                setShopData(JSON.parse(savedShopData));
            }
        }
    }, [location]);

    return (
        <Box sx={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            minHeight: 'calc(100vh - 70px)',
            backgroundColor: '#ffffff',
            marginTop: '70px',
            marginLeft: '240px',
            width: 'calc(100% - 240px)',
            p: 4
        }}>
            {shopData ? (
                <Card 
                    sx={{ 
                        width: '100%',
                        maxWidth: '800px',
                        p: 4, 
                        borderRadius: '12px',
                        border: '1px solid #f0f0f0'
                    }}
                >
                    {/* Shop Name and Icon */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Store sx={{ fontSize: 56, color: '#15BE77', mb: 2 }} />
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
                                <LocationOn sx={{ color: '#15BE77', mr: 2 }} />
                                <Typography color="#666">{shopData.location}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <MeetingRoom sx={{ color: '#15BE77', mr: 2 }} />
                                <Typography color="#666">Gate {shopData.gate}, Floor {shopData.floor}</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Shop Description */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#555', fontWeight: '500' }}>
                            About Shop
                        </Typography>
                        <Typography color="#666" sx={{ lineHeight: 1.6 }}>
                            {shopData.description || 'No description available'}
                        </Typography>
                    </Box>

                    {/* Created Date */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AccessTime sx={{ color: '#15BE77', mr: 1 }} />
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

export default Dashboard;