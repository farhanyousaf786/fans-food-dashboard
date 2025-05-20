import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  LinearProgress 
} from '@mui/material';
import { 
  Add, 
  Restaurant,
  ShoppingCart as OrdersIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon 
} from '@mui/icons-material';
import { db } from '../../config/firebase';
import { collection, addDoc, query, getDocs, orderBy, where } from 'firebase/firestore';
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
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOrders: 0,
        revenue: 0,
        customers: 0,
        growth: 0
    });
    const [newMenuItem, setNewMenuItem] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        images: [],
        isAvailable: true,
        preparationTime: 15,
        customization: {
            toppings: [],
            extras: [],
            sauces: [],
            sizes: []
        },
        allergens: [],
        nutritionalInfo: {}
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const ordersRef = collection(db, 'orders');
                const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
                const ordersSnap = await getDocs(ordersQuery);

                let totalRevenue = 0;
                const customers = new Set();

                ordersSnap.forEach(doc => {
                    const order = doc.data();
                    totalRevenue += order.total || 0;
                    if (order.userInfo?.userId) {
                        customers.add(order.userInfo.userId);
                    }
                });

                setStats({
                    totalOrders: ordersSnap.size,
                    revenue: totalRevenue,
                    customers: customers.size,
                    growth: 12.5 // Example growth rate
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching stats:', error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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
            images: [],
            isAvailable: true,
            preparationTime: 15,
            customization: {
                toppings: [],
                extras: [],
                sauces: [],
                sizes: []
            },
            allergens: [],
            nutritionalInfo: {}
        });
    };

    const handleInputChange = (e) => {
        const { name, value, checked } = e.target;
        if (name === 'customization') {
            // Handle customization updates
            setNewMenuItem(prev => ({
                ...prev,
                customization: value
            }));
        } else {
            // Handle other field updates
            setNewMenuItem(prev => ({
                ...prev,
                [name]: name === 'isAvailable' ? checked : value
            }));
        }
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
                shopData.id,
                shopData.stadiumId,
                newMenuItem.customization,
                newMenuItem.allergens,
                newMenuItem.nutritionalInfo
            );

            const menuItemsRef = collection(db, 'stadiums', shopData.stadiumId, 'shops', shopData.id, 'menuItems');
            await addDoc(menuItemsRef, menuItem.toFirestore());
            return true; // Return success to trigger success dialog
        } catch (error) {
            console.error('Error creating menu item:', error);
            throw error; // Re-throw to handle in AddMenuDialog
        }
    };

    const statsCards = [
        {
            title: 'Total Orders',
            value: stats.totalOrders,
            icon: <OrdersIcon />,
            color: '#4C9E48',
            lightColor: '#e8f5e9'
        },
        {
            title: 'Revenue',
            value: `$${stats.revenue.toFixed(2)}`,
            icon: <MoneyIcon />,
            color: '#2196f3',
            lightColor: '#e3f2fd'
        },
        {
            title: 'Customers',
            value: stats.customers,
            icon: <PeopleIcon />,
            color: '#ff9800',
            lightColor: '#fff3e0'
        },
        {
            title: 'Growth',
            value: `${stats.growth}%`,
            icon: <TrendingUpIcon />,
            color: '#e91e63',
            lightColor: '#fce4ec'
        }
    ];

    if (loading) {
        return (
            <Box sx={{ mt: 4 }}>
                <LinearProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary', mb: 3 }}>
                    Dashboard Overview
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {statsCards.map((card, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card 
                                sx={{ 
                                    height: '100%',
                                    backgroundColor: card.lightColor,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': {
                                        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
                                        transform: 'translateY(-2px)',
                                        transition: 'all 0.3s'
                                    }
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                                                {card.title}
                                            </Typography>
                                            <Typography variant="h4" sx={{ color: card.color, fontWeight: 600 }}>
                                                {card.value}
                                            </Typography>
                                        </Box>
                                        <Box 
                                            sx={{ 
                                                backgroundColor: card.color,
                                                borderRadius: '12px',
                                                p: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {React.cloneElement(card.icon, { sx: { color: '#fff' } })}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {shopData ? (
                <>
                    <Box sx={{ backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
                        shopData={shopData}
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