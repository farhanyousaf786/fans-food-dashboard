import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Grid } from '@mui/material';
import { Add, Restaurant } from '@mui/icons-material';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import MenuItem from '../../models/MenuItem';
import AddMenuDialog from './components/AddMenuDialog';

const Dashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [shopData, setShopData] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [newMenuItem, setNewMenuItem] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        imageUrl: '',
        isAvailable: true,
        preparationTime: 15,
        options: [],
        allergens: [],
        nutritionalInfo: {}
    });

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

    const handleAddMenu = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setNewMenuItem({
            name: '',
            description: '',
            price: '',
            category: '',
            images: [],
            isAvailable: true,
            preparationTime: 15,
            options: [],
            allergens: [],
            nutritionalInfo: {}
        });
    };

    const handleInputChange = (e) => {
        const { name, value, checked } = e.target;
        setNewMenuItem(prev => ({
            ...prev,
            [name]: name === 'isAvailable' ? checked : value
        }));
    };

    const handleCreateMenuItem = async () => {
        try {
            const menuItem = new MenuItem(
                newMenuItem.name,
                newMenuItem.description,
                parseFloat(newMenuItem.price),
                newMenuItem.category,
                newMenuItem.images.map(img => img.file),
                newMenuItem.isAvailable,
                parseInt(newMenuItem.preparationTime),
                shopData.id
            );

            const menuItemsRef = collection(db, 'stadiums', shopData.stadiumId, 'shops', shopData.id, 'menuItems');
            await addDoc(menuItemsRef, menuItem.toFirestore());
            handleCloseDialog();
            // TODO: Refresh menu items list
        } catch (error) {
            console.error('Error creating menu item:', error);
        }
    };

    return (
        <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            minHeight: 'calc(100vh - 70px)',
            backgroundColor: '#ffffff',
            marginTop: '70px',
            marginLeft: '240px',
            width: 'calc(100% - 240px)',
            p: 4
        }}>
            {shopData ? (
                <>
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h4" fontWeight="500" color="#333">
                            Menu Management
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleAddMenu}
                            sx={{
                                bgcolor: '#15BE77',
                                '&:hover': { bgcolor: '#13ab6c' }
                            }}
                        >
                            Add Menu Item
                        </Button>
                    </Box>

                    {/* Add Menu Item Dialog */}
                    <AddMenuDialog
                        open={openDialog}
                        onClose={handleCloseDialog}
                        onSubmit={handleCreateMenuItem}
                        menuItem={newMenuItem}
                        onChange={handleInputChange}
                    />

                    <Grid container spacing={3}>
                        {/* Menu items will be added here */}
                        <Grid item xs={12}>
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '300px',
                                border: '2px dashed #e0e0e0',
                                borderRadius: '12px',
                                p: 4
                            }}>
                                <Restaurant sx={{ fontSize: 64, color: '#15BE77', mb: 2, opacity: 0.5 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No Menu Items Yet
                                </Typography>
                                <Typography color="text.secondary" align="center">
                                    Click the "Add Menu Item" button above to start creating your menu.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </>

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