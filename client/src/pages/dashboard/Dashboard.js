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
            <Box sx={{ mb: 6, px: 2 }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    mb: 4
                }}>
                    <Box>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 700, 
                                color: '#2D3748',
                                fontSize: { xs: '1.5rem', md: '2rem' },
                                mb: 1
                            }}
                        >
                            Dashboard Overview
                        </Typography>
                        {shopData && (
                            <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                    color: 'text.secondary',
                                    fontSize: '1rem'
                                }}
                            >
                                {shopData.name}
                            </Typography>
                        )}
                    </Box>

                    {shopData && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleAddMenu}
                            sx={{
                                bgcolor: '#4C9E48',
                                '&:hover': { bgcolor: '#3d8b3d' },
                                px: 3,
                                py: 1,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 500,
                                boxShadow: '0 4px 12px rgba(76, 158, 72, 0.2)'
                            }}
                        >
                            Add Menu Item
                        </Button>
                    )}
                </Box>

                <Grid container spacing={4}>
                    {statsCards.map((card, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card 
                                elevation={0}
                                sx={{ 
                                    height: '100%',
                                    backgroundColor: card.lightColor,
                                    borderRadius: 3,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 12px 24px 0 rgba(0,0,0,0.09)'
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        background: `linear-gradient(45deg, ${card.color}15, ${card.color}05)`,
                                        zIndex: 0
                                    }
                                }}
                            >
                                <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Typography 
                                            variant="h6" 
                                            sx={{ 
                                                color: 'text.secondary',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em'
                                            }}
                                        >
                                            {card.title}
                                        </Typography>
                                        <Box 
                                            sx={{ 
                                                backgroundColor: card.color,
                                                borderRadius: '50%',
                                                width: 46,
                                                height: 46,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: `0 8px 16px ${card.color}40`
                                            }}
                                        >
                                            {React.cloneElement(card.icon, { 
                                                sx: { 
                                                    color: '#fff',
                                                    fontSize: 24
                                                } 
                                            })}
                                        </Box>
                                    </Box>
                                    <Typography 
                                        variant="h3" 
                                        sx={{ 
                                            color: card.color,
                                            fontWeight: 700,
                                            fontSize: { xs: '1.75rem', md: '2rem' },
                                            lineHeight: 1.2,
                                            letterSpacing: '-0.01em'
                                        }}
                                    >
                                        {card.value}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {shopData ? (
                <>


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