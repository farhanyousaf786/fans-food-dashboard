import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { RestaurantMenu, AttachMoney, ShoppingCart, People } from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
    { month: 'Jan', revenue: 600 },
    { month: 'Feb', revenue: 400 },
    { month: 'Mar', revenue: 1000 },
    { month: 'Apr', revenue: 300 },
    { month: 'May', revenue: 400 },
    { month: 'Jun', revenue: 500 },
    { month: 'Jul', revenue: 800 },
    { month: 'Aug', revenue: 400 },
    { month: 'Sep', revenue: 900 },
    { month: 'Oct', revenue: 700 },
    { month: 'Nov', revenue: 800 }
];

const Dashboard = () => {
    const [timeRange, setTimeRange] = useState('today');

    const handleTimeRangeChange = (event, newValue) => {
        if (newValue !== null) {
            setTimeRange(newValue);
        }
    };

    return (
        <Box sx={{ 
            flexGrow: 1,
            p: 3,
            minHeight: 'calc(100vh - 70px)', // Full height minus header
            backgroundColor: '#f8f9fa',
            marginTop: '70px', // Header height
            marginLeft: '240px', // Sidebar width
            width: 'calc(100% - 240px)' // Full width minus sidebar
        }}>
            {/* Stats Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        sx={{
                            p: 3,
                            background: 'linear-gradient(135deg, #15BE77 30%, #17CF81 100%)',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(21, 190, 119, 0.15)',
                            minHeight: '120px'
                        }}
                    >
                        <Box>
                            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>459</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Menus</Typography>
                        </Box>
                        <RestaurantMenu sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        sx={{
                            p: 3,
                            background: 'linear-gradient(135deg, #15BE77 30%, #17CF81 100%)',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(21, 190, 119, 0.15)',
                            minHeight: '120px'
                        }}
                    >
                        <Box>
                            <Typography variant="h4" fontWeight="bold">$87,561</Typography>
                            <Typography variant="subtitle2">Total Revenue</Typography>
                        </Box>
                        <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        sx={{
                            p: 3,
                            background: 'linear-gradient(135deg, #15BE77 30%, #17CF81 100%)',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(21, 190, 119, 0.15)',
                            minHeight: '120px'
                        }}
                    >
                        <Box>
                            <Typography variant="h4" fontWeight="bold">247</Typography>
                            <Typography variant="subtitle2">Total Orders</Typography>
                        </Box>
                        <ShoppingCart sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        sx={{
                            p: 3,
                            background: 'linear-gradient(135deg, #15BE77 30%, #17CF81 100%)',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(21, 190, 119, 0.15)',
                            minHeight: '120px'
                        }}
                    >
                        <Box>
                            <Typography variant="h4" fontWeight="bold">872</Typography>
                            <Typography variant="subtitle2">Total Customers</Typography>
                        </Box>
                        <People sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Paper>
                </Grid>
            </Grid>

            {/* Orders Summary */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Orders Summary</Typography>
                            <ToggleButtonGroup
                                value={timeRange}
                                exclusive
                                onChange={handleTimeRangeChange}
                                size="small"
                                sx={{
                                    '& .MuiToggleButton-root': {
                                        border: 'none',
                                        borderRadius: '20px !important',
                                        mx: 0.5,
                                        color: '#666',
                                        '&.Mui-selected': {
                                            backgroundColor: '#15BE77',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: '#15BE77',
                                            }
                                        }
                                    }
                                }}
                            >
                                <ToggleButton value="monthly">Monthly</ToggleButton>
                                <ToggleButton value="weekly">Weekly</ToggleButton>
                                <ToggleButton value="today">Today</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: 120,
                                    height: 120,
                                    borderRadius: '50%',
                                    background: `conic-gradient(#15BE77 0% 85%, #eee 85% 100%)`,
                                    boxShadow: '0 4px 20px rgba(21, 190, 119, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: '50%',
                                        background: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Typography variant="h4" fontWeight="bold">85%</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ ml: 4 }}>
                                <Typography variant="h5" fontWeight="bold">$456,005.56</Typography>
                                <Typography variant="body2" color="text.secondary">from $500,000.00</Typography>
                            </Box>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Typography variant="h6" fontWeight="bold">25</Typography>
                                <Typography variant="body2" color="text.secondary">On Delivery</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="h6" fontWeight="bold">60</Typography>
                                <Typography variant="body2" color="text.secondary">Delivered</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="h6" fontWeight="bold">7</Typography>
                                <Typography variant="body2" color="text.secondary">Cancelled</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Revenue Chart */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Revenue</Typography>
                            <ToggleButtonGroup
                                value={timeRange}
                                exclusive
                                onChange={handleTimeRangeChange}
                                size="small"
                                sx={{
                                    '& .MuiToggleButton-root': {
                                        border: 'none',
                                        borderRadius: '20px !important',
                                        mx: 0.5,
                                        color: '#666',
                                        '&.Mui-selected': {
                                            backgroundColor: '#15BE77',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: '#15BE77',
                                            }
                                        }
                                    }
                                }}
                            >
                                <ToggleButton value="all">All Food</ToggleButton>
                                <ToggleButton value="food">Food</ToggleButton>
                                <ToggleButton value="beverages">Beverages</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                        <Box sx={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={mockData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#15BE77" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#15BE77" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#15BE77"
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Customer Map and Trending Menus */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                        <Typography variant="h6">Customer Map</Typography>
                        {/* Add map component here */}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                        <Typography variant="h6">Daily Trending Menus</Typography>
                        {/* Add trending menus list here */}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;