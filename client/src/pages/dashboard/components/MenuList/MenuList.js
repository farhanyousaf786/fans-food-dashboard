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
    Skeleton
} from '@mui/material';
import {
    MoreVert,
    Edit,
    Delete,
    AccessTime,
    Circle
} from '@mui/icons-material';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import './MenuList.css';

const MenuList = ({ shopData }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

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
        // TODO: Implement edit functionality
        handleMenuClose();
    };

    const handleDelete = () => {
        // TODO: Implement delete functionality
        handleMenuClose();
    };

    if (loading) {
        return (
            <Grid container spacing={3}>
                {[1, 2, 3].map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item}>
                        <Card>
                            <Skeleton variant="rectangular" height={200} />
                            <CardContent>
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
        <Grid container spacing={3}>
            {menuItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card className="menu-card">
                        <CardMedia
                            component="img"
                            height="200"
                            image={item.images?.[0] || '/placeholder-food.jpg'}
                            alt={item.name}
                            className="menu-image"
                        />
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
    );
};

export default MenuList;
