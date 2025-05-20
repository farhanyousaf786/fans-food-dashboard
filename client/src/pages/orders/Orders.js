import React, { useState, useEffect } from 'react';
import { Box, Typography, Menu, MenuItem, CircularProgress, Grid, Container, ButtonGroup, Button } from '@mui/material';
import { AccessTime, LocalDining, LocalShipping } from '@mui/icons-material';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Order from '../../models/Order';
import OrderCard from './components/OrderCard';
import OrderDetails from './components/OrderDetails';
import OrderFilters from './components/OrderFilters';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shopData, setShopData] = useState(null);

  // Get shop data from localStorage
  useEffect(() => {
    const savedShopData = localStorage.getItem('currentShopData');
    if (savedShopData) {
      setShopData(JSON.parse(savedShopData));
    }
  }, []);

  useEffect(() => {
    const savedShopId = JSON.parse(localStorage.getItem('currentShopData'))?.id;
    if (!savedShopId) return;

    const ordersRef = collection(db, 'orders');
    // Filter orders by shop ID
    const q = query(ordersRef, where('shopId', '==', savedShopId));

    setLoading(true);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => {
        const data = doc.data();
        const order = Order.fromFirestore(data);
        return { id: doc.id, ...order };
      });
      setOrders(ordersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);



  const getStatusColor = (status) => {
    const map = { 0: 'warning', 1: 'info', 2: 'info', 3: 'success', 4: 'default', 5: 'error' };
    return map[status] || 'default';
  };

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
      await updateDoc(orderRef, { status: newStatus, updatedAt: new Date() });
      handleMenuClose();
    } catch (e) {
      console.error('Error updating order status:', e);
    }
  };

  const openDialog = (order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
  };

  const filterOrders = (status) => {
    setSelectedFilter(status);
    // Convert status text to numeric status
    const statusMap = {
      'all': 'all',
      'pending': '0',
      'preparing': '1',
      'delivering': '2',
      'completed': '3'
    };
    setSelectedFilter(statusMap[status] || 'all');
  };

  if (loading) {
    return <Box className="loading-container"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Orders Management
        </Typography>
        
        {/* Centered Filter Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 4,
          '& .MuiButtonGroup-root': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }
        }}>
          <ButtonGroup variant="contained" size="medium">
            <Button 
              onClick={() => filterOrders('all')}
              sx={{ 
                bgcolor: selectedFilter === 'all' ? 'primary.main' : 'white',
                color: selectedFilter === 'all' ? 'white' : 'primary.main',
                '&:hover': {
                  bgcolor: selectedFilter === 'all' ? 'primary.dark' : 'grey.100'
                }
              }}
            >
              All Orders
            </Button>
            <Button 
              onClick={() => filterOrders('pending')}
              sx={{ 
                bgcolor: selectedFilter === 'pending' ? 'primary.main' : 'white',
                color: selectedFilter === 'pending' ? 'white' : 'primary.main',
                '&:hover': {
                  bgcolor: selectedFilter === 'pending' ? 'primary.dark' : 'grey.100'
                }
              }}
            >
              Pending
            </Button>
            <Button 
              onClick={() => filterOrders('preparing')}
              sx={{ 
                bgcolor: selectedFilter === 'preparing' ? 'primary.main' : 'white',
                color: selectedFilter === 'preparing' ? 'white' : 'primary.main',
                '&:hover': {
                  bgcolor: selectedFilter === 'preparing' ? 'primary.dark' : 'grey.100'
                }
              }}
            >
              Preparing
            </Button>
            <Button 
              onClick={() => filterOrders('delivering')}
              sx={{ 
                bgcolor: selectedFilter === 'delivering' ? 'primary.main' : 'white',
                color: selectedFilter === 'delivering' ? 'white' : 'primary.main',
                '&:hover': {
                  bgcolor: selectedFilter === 'delivering' ? 'primary.dark' : 'grey.100'
                }
              }}
            >
              Delivering
            </Button>
            <Button 
              onClick={() => filterOrders('delivered')}
              sx={{ 
                bgcolor: selectedFilter === 'delivered' ? 'primary.main' : 'white',
                color: selectedFilter === 'delivered' ? 'white' : 'primary.main',
                '&:hover': {
                  bgcolor: selectedFilter === 'delivered' ? 'primary.dark' : 'grey.100'
                }
              }}
            >
              Completed
            </Button>
          </ButtonGroup>
        </Box>

        <Grid container spacing={3}>
          {orders
            .filter(o => selectedFilter === 'all' || o.status.toString() === selectedFilter)
            .sort((a, b) => {
              switch (sortBy) {
                case 'total': return b.total - a.total;
                case 'items': return (b.cart?.length || 0) - (a.cart?.length || 0);
                case 'date':
                default: return new Date(b.createdAt) - new Date(a.createdAt);
              }
            })
            .map((order) => (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <OrderCard
                  order={order}
                  onViewDetails={openDialog}
                  onMenuClick={handleMenuClick}
                  restaurantName="Order"
                  getStatusColor={getStatusColor}
                />
              </Grid>
            ))}
        </Grid>
      </Box>

      <OrderDetails
        order={selectedOrder}
        open={dialogOpen}
        onClose={closeDialog}
        restaurantName="Order"
      />

      {/* Status Change Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleStatusChange(0)}><AccessTime fontSize="small" sx={{ mr: 1 }} /> Pending</MenuItem>
        <MenuItem onClick={() => handleStatusChange(1)}><LocalDining fontSize="small" sx={{ mr: 1 }} /> Preparing</MenuItem>
        <MenuItem onClick={() => handleStatusChange(2)}><LocalShipping fontSize="small" sx={{ mr: 1 }} /> Delivering</MenuItem>
        <MenuItem onClick={() => handleStatusChange(3)}><LocalShipping fontSize="small" sx={{ mr: 1 }} /> Delivered</MenuItem>
        <MenuItem onClick={() => handleStatusChange(4)}><LocalShipping fontSize="small" sx={{ mr: 1 }} /> Cancelled</MenuItem>
      </Menu>
    </Container>
  );
};

export default Orders;
