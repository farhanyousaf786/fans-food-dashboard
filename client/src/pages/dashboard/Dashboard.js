import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Grid } from '@mui/material';
import { Add, Restaurant } from '@mui/icons-material';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import MenuItem from '../../models/MenuItem';
import AddMenuDialog from './components/AddMenuDialod/AddMenuDialog';
import MenuList from './components/MenuList/MenuList';

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
        images: [], // Initialize images array
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
        // Clean up image previews before resetting
        if (newMenuItem.images?.length > 0) {
            newMenuItem.images.forEach(img => {
                if (img.preview) {
                    URL.revokeObjectURL(img.preview);
                }
            });
        }
        setOpenDialog(false);
        setNewMenuItem({
            name: '',
            description: '',
            price: '',
            category: '',
            images: [], // Initialize images array
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
            // First upload all images and get their URLs
            const imageUrls = [];
            if (newMenuItem.images?.length > 0) {
                for (const image of newMenuItem.images) {
                    if (image.file) {
                        const storageRef = ref(storage, `menuItems/${shopData.id}/${Date.now()}-${image.file.name}`);
                        const snapshot = await uploadBytes(storageRef, image.file);
                        const url = await getDownloadURL(snapshot.ref);
                        imageUrls.push(url);
                    }
                }
            }

            const menuItem = new MenuItem(
                newMenuItem.name,
                newMenuItem.description,
                parseFloat(newMenuItem.price),
                newMenuItem.category,
                imageUrls,
                newMenuItem.isAvailable,
                parseInt(newMenuItem.preparationTime),
                shopData.id
            );

            const menuItemsRef = collection(db, 'stadiums', shopData.stadiumId, 'shops', shopData.id, 'menuItems');
            await addDoc(menuItemsRef, menuItem.toFirestore());
            return true; // Return success to trigger success dialog
        } catch (error) {
            console.error('Error creating menu item:', error);
            throw error; // Re-throw to handle in AddMenuDialog
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Restaurant sx={{ fontSize: 40, color: '#15BE77' }} />
                            <Box>
                                <Typography variant="h4" fontWeight="600">
                                    Menu Management
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary">
                                    {shopData.name}
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleAddMenu}
                            sx={{
                                bgcolor: '#15BE77',
                                '&:hover': { bgcolor: '#13ab6c' },
                                px: 3
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

                    <MenuList shopData={shopData} />
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