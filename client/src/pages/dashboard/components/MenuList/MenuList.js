import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardMedia,
    CardContent,
    Typography,
    IconButton,
    Chip,
    Menu,
    MenuItem,
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert
} from '@mui/material';
import {
    MoreVert,
    Edit,
    Delete,
    AccessTime,
    Circle,
    Warning
} from '@mui/icons-material';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';

import { db, storage } from '../../../../config/firebase';
import EditMenuDialog from './EditMenuDialog';
import './MenuList.css';

const MenuList = ({ shopData }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!shopData?.id) return;

        const menuItemsRef = collection(db, 'stadiums', shopData.stadiumId, 'shops', shopData.id, 'menuItems');
        const q = query(menuItemsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMenuItems(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [shopData]);

    const handleMenuClick = (event, item) => {
        setAnchorEl(event.currentTarget);
        setSelectedItem(item);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedItem(null);
    };

    const handleEdit = () => {
        setEditDialogOpen(true);
        handleMenuClose();
    };

    const handleDelete = () => {
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const handleUpdateMenuItem = async (updatedItem) => {
        try {
            if (!selectedItem?.id || !shopData?.id || !shopData?.stadiumId) {
                throw new Error('Missing required data');
            }

            const menuItemRef = doc(db, 'stadiums', shopData.stadiumId, 'shops', shopData.id, 'menuItems', selectedItem.id);
            
            // First upload any new images
            const imageUrls = [];
            if (updatedItem.images?.length > 0) {
                for (const image of updatedItem.images) {
                    if (typeof image === 'string') {
                        // Keep existing image URLs
                        imageUrls.push(image);
                    } else if (image.file) {
                        try {
                            // Upload new images
                            const storageRef = ref(storage, `menuItems/${shopData.id}/${Date.now()}-${image.file.name}`);
                            const snapshot = await uploadBytes(storageRef, image.file);
                            const url = await getDownloadURL(snapshot.ref);
                            imageUrls.push(url);
                        } catch (uploadError) {
                            console.error('Error uploading image:', uploadError);
                            throw new Error('Failed to upload image');
                        }
                    }
                }
            }

            // Update the item in Firestore
            const itemToUpdate = {
                ...updatedItem,
                images: imageUrls.length > 0 ? imageUrls : updatedItem.images || [],
                updatedAt: new Date().toISOString()
            };

            await updateDoc(menuItemRef, itemToUpdate);
            setSuccess('Menu item updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
            setEditDialogOpen(false);
        } catch (error) {
            console.error('Error updating menu item:', error);
            setError(error.message || 'Failed to update menu item');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            if (!selectedItem?.id || !shopData?.id || !shopData?.stadiumId) {
                throw new Error('Missing required data');
            }

            // Delete images from storage
            if (selectedItem.images?.length > 0) {
                for (const imageUrl of selectedItem.images) {
                    try {
                        // Only delete if it's a storage URL
                        if (imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
                            const imageRef = ref(storage, imageUrl);
                            await deleteObject(imageRef);
                        }
                    } catch (error) {
                        console.error('Error deleting image:', error);
                        // Continue with deletion even if image delete fails
                    }
                }
            }

            // Delete document from Firestore
            const menuItemRef = doc(db, 'stadiums', shopData.stadiumId, 'shops', shopData.id, 'menuItems', selectedItem.id);
            await deleteDoc(menuItemRef);
            
            setSuccess('Menu item deleted successfully!');
            setTimeout(() => setSuccess(''), 3000);
            setDeleteDialogOpen(false);
            setSelectedItem(null);
        } catch (error) {
            console.error('Error deleting menu item:', error);
            setError(error.message || 'Failed to delete menu item');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) {
        return (
            <Grid container spacing={3}>
                {[1, 2, 3].map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
                                <Skeleton 
                                    variant="rectangular" 
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%'
                                    }}
                                />
                            </Box>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Skeleton variant="text" width="60%" />
                                <Skeleton variant="text" width="40%" />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    }

    if (menuItems.length === 0) {
        return (
            <Box className="empty-state">
                <Typography variant="h6" color="text.secondary">
                    No Menu Items Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Click the "Add Menu Item" button above to start creating your menu.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}
            <Grid container spacing={3}>
            {menuItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
                            <CardMedia
                                component="img"
                                image={item.images?.[0] || '/placeholder.jpg'}
                                alt={item.name}
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </Box>
                        <CardContent className="menu-content">
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="h6" className="menu-title">
                                    {item.name}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleMenuClick(e, item)}
                                    className="more-button"
                                >
                                    <MoreVert />
                                </IconButton>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" className="menu-description">
                                {item.description}
                            </Typography>

                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" color="primary" className="menu-price">
                                    ${parseFloat(item.price).toFixed(2)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        icon={<Circle sx={{ fontSize: 12 }} />}
                                        label={item.isAvailable ? 'Available' : 'Unavailable'}
                                        color={item.isAvailable ? 'success' : 'default'}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Chip
                                        icon={<AccessTime sx={{ fontSize: 12 }} />}
                                        label={`${item.preparationTime} min`}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleEdit}>
                    <Edit sx={{ mr: 1, fontSize: 20 }} />
                    Edit Item
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <Delete sx={{ mr: 1, fontSize: 20 }} />
                    Delete Item
                </MenuItem>
            </Menu>
            </Grid>

            {/* Edit Dialog */}
            <EditMenuDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                onSubmit={handleUpdateMenuItem}
                menuItem={selectedItem}
                shopData={shopData}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="warning" />
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete} 
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MenuList;
