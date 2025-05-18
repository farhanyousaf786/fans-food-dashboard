import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
    Box,
    Typography,
    Paper,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    CircularProgress,
    Card,
    CardContent,
    CardMedia,
    Grid,
    Collapse,
    CardActions,
    Button,
    Stack,
    Divider,
    Avatar,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import {
    MoreVert,
    AccessTime,
    LocalDining,
    Payment,
    LocalShipping,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    ShoppingCart,
    Person,
    LocationOn
} from '@mui/icons-material';
import { collection, query, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Order from '../../models/Order';
import './Orders.css';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [restaurantNames, setRestaurantNames] = useState({});

    // Fetch restaurant names when orders change
    useEffect(() => {
        const fetchRestaurantNames = async () => {
            const newRestaurantNames = { ...restaurantNames };
            let hasNewNames = false;

            for (const order of orders) {
                if (order.restaurant && !restaurantNames[order.restaurant]) {
                    try {
                        const restaurantRef = doc(db, order.restaurant);
                        const restaurantSnap = await getDoc(restaurantRef);
                        if (restaurantSnap.exists()) {
                            newRestaurantNames[order.restaurant] = restaurantSnap.data().name || 'Unknown Restaurant';
                            hasNewNames = true;
                        }
                    } catch (error) {
                        console.error('Error fetching restaurant:', error);
                        newRestaurantNames[order.restaurant] = 'Unknown Restaurant';
                        hasNewNames = true;
                    }
                }
            }

            if (hasNewNames) {
                setRestaurantNames(newRestaurantNames);
            }
        };

        if (orders.length > 0) {
            fetchRestaurantNames();
        }
    }, [orders, restaurantNames]);

    useEffect(() => {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersList = snapshot.docs.map(doc => {
                const data = doc.data();
                const order = Order.fromFirestore(data);
                return {
                    id: doc.id,
                    itemId: order.itemId,
                    shopId: order.shopId,
                    status: order.status,
                    total: order.total,
                    subtotal: order.subtotal,
                    deliveryFee: order.deliveryFee,
                    discount: order.discount,
                    paymentMethod: order.paymentMethod,
                    cart: order.cart,
                    restaurant: order.restaurant,
                    isCompleted: order.isCompleted,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt
                };
            });
            setOrders(ordersList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleMenuClick = (event, order) => {
        setAnchorEl(event.currentTarget);
        setSelectedOrder(order);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedOrder(null);
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedOrder) return;

        try {
            const orderRef = doc(db, 'orders', selectedOrder.id);
            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: new Date()
            });
            handleMenuClose();
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    const getStatusColor = (status) => {
        const colorMap = {
            0: 'warning', // Pending
            1: 'info',    // Accepted
            2: 'info',    // Preparing
            3: 'success', // Ready
            4: 'default', // Delivered
            5: 'error'    // Cancelled
        };
        return colorMap[status] || 'default';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const handleExpandClick = (orderId) => {
        setExpandedId(expandedId === orderId ? null : orderId);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h4" fontWeight="600">
                    Orders Management
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Manage and track all orders
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            label="Status"
                        >
                            <MenuItem value="all">All Orders</MenuItem>
                            <MenuItem value="0">Pending</MenuItem>
                            <MenuItem value="1">Accepted</MenuItem>
                            <MenuItem value="2">Preparing</MenuItem>
                            <MenuItem value="3">Ready</MenuItem>
                            <MenuItem value="4">Delivered</MenuItem>
                            <MenuItem value="5">Cancelled</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            label="Sort By"
                        >
                            <MenuItem value="date">Date</MenuItem>
                            <MenuItem value="total">Total</MenuItem>
                            <MenuItem value="items">Items</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {orders
                    .filter(order => statusFilter === 'all' || order.status.toString() === statusFilter)
                    .sort((a, b) => {
                        switch (sortBy) {
                            case 'total':
                                return b.total - a.total;
                            case 'items':
                                return (b.cart?.length || 0) - (a.cart?.length || 0);
                            case 'date':
                            default:
                                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        }
                    })
                    .map((order) => (
                    <Grid item xs={12} sm={6} md={4} key={order.id}>
                        <Card elevation={3}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6" component="div">
                                        Order #{order.id.slice(0, 8)}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuClick(e, order)}
                                    >
                                        <MoreVert />
                                    </IconButton>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <Chip
                                        label={Order.getStatusText(order.status)}
                                        color={getStatusColor(order.status)}
                                        size="small"
                                        className="status-chip"
                                    />
                                    <Chip
                                        icon={<Payment sx={{ fontSize: 16 }} />}
                                        label={Order.getPaymentMethodText(order.paymentMethod)}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Grid container spacing={2}>
                                        {order.cart && order.cart.map((item, index) => (
                                            <Grid item xs={4} key={index}>
                                                <Card variant="outlined">
                                                    <CardMedia
                                                        component="img"
                                                        height="80"
                                                        image={item.images?.[0] || 'https://via.placeholder.com/80'}
                                                        alt={item.name}
                                                        sx={{ objectFit: 'cover' }}
                                                    />
                                                </Card>
                                            </Grid>
                                        )).slice(0, 3)}
                                    </Grid>
                                </Box>

                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="subtitle1" color="text.secondary">
                                        <ShoppingCart sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                                        {order.cart?.length || 0} items
                                    </Typography>
                                    <Typography variant="subtitle1" color="primary.main" fontWeight="600">
                                        ${order.total}
                                    </Typography>
                                </Stack>

                                <CardActions>
                                    <Button
                                        size="small"
                                        onClick={() => handleExpandClick(order.id)}
                                        endIcon={expandedId === order.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    >
                                        {expandedId === order.id ? 'Show Less' : 'View Details'}
                                    </Button>
                                </CardActions>

                                <Collapse in={expandedId === order.id} timeout="auto" unmountOnExit>
                                    <CardContent>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack spacing={2}>
                                            <Typography variant="h6" gutterBottom>
                                                Order Details
                                            </Typography>
                                            
                                            <Box>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Items
                                                </Typography>
                                                {order.cart && order.cart.map((item, index) => (
                                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Avatar
                                                            src={item.images?.[0]}
                                                            variant="rounded"
                                                            sx={{ width: 40, height: 40, mr: 2 }}
                                                        />
                                                        <Box>
                                                            <Typography variant="body2">{item.name}</Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                ${item.price} × {item.quantity || 1}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Price Details
                                                </Typography>
                                                <Stack spacing={1}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="body2">Subtotal</Typography>
                                                        <Typography variant="body2">${order.subtotal}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="body2">Delivery Fee</Typography>
                                                        <Typography variant="body2">${order.deliveryFee}</Typography>
                                                    </Box>
                                                    {order.discount > 0 && (
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <Typography variant="body2" color="success.main">Discount</Typography>
                                                            <Typography variant="body2" color="success.main">-${order.discount}</Typography>
                                                        </Box>
                                                    )}
                                                    <Divider />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="subtitle2">Total</Typography>
                                                        <Typography variant="subtitle2" color="primary.main">${order.total}</Typography>
                                                    </Box>
                                                </Stack>
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Delivery Information
                                                </Typography>
                                                <Stack spacing={1}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Person sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                                                        <Typography variant="body2">{order.customerName || 'Customer'}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <LocationOn sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                                                        <Typography variant="body2">
                                                            {restaurantNames[order.restaurant] || 'Loading restaurant...'}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Box>

                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Created: {new Date(order.createdAt).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Collapse>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                className="order-menu"
            >
                <MenuItem onClick={() => handleStatusChange(1)} className="order-menu-item">
                    <AccessTime sx={{ mr: 1, fontSize: 20 }} />
                    Accept Order
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange(2)} className="order-menu-item">
                    <LocalDining sx={{ mr: 1, fontSize: 20 }} />
                    Start Preparing
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange(3)} className="order-menu-item">
                    <LocalShipping sx={{ mr: 1, fontSize: 20 }} />
                    Mark as Ready
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange(4)} className="order-menu-item">
                    <LocalShipping sx={{ mr: 1, fontSize: 20 }} />
                    Mark as Delivered
                </MenuItem>
                <MenuItem 
                    onClick={() => handleStatusChange(5)} 
                    sx={{ color: 'error.main' }}
                    className="order-menu-item"
                >
                    <LocalShipping sx={{ mr: 1, fontSize: 20 }} />
                    Cancel Order
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default Orders;
