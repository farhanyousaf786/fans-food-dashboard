import React, { useState, useEffect } from 'react';
import { Box, Typography, Menu, MenuItem, CircularProgress, Grid } from '@mui/material';
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
  const [statusFilter, setStatusFilter] = useState('all');
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

  if (loading) {
    return <Box className="loading-container"><CircularProgress /></Box>;
  }

  return (
    <Box className="orders-container">
      <Box className="orders-header">
        <Typography variant="h4" className="orders-title">Orders Management</Typography>
        <OrderFilters
          statusFilter={statusFilter}
          sortBy={sortBy}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          onSortChange={(e) => setSortBy(e.target.value)}
        />
      </Box>

      <Grid container spacing={3}>
        {orders
          .filter(o => statusFilter === 'all' || o.status.toString() === statusFilter)
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

      <OrderDetails
        order={selectedOrder}
        open={dialogOpen}
        onClose={closeDialog}
        restaurantName="Order"
      />

      {/* MENU */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleStatusChange(0)}><AccessTime fontSize="small" sx={{ mr: 1 }} /> Pending</MenuItem>
        <MenuItem onClick={() => handleStatusChange(1)}><LocalDining fontSize="small" sx={{ mr: 1 }} /> Preparing</MenuItem>
        <MenuItem onClick={() => handleStatusChange(2)}><LocalShipping fontSize="small" sx={{ mr: 1 }} /> Delivering</MenuItem>
        <MenuItem onClick={() => handleStatusChange(3)}><LocalShipping fontSize="small" sx={{ mr: 1 }} /> Delivered</MenuItem>
        <MenuItem onClick={() => handleStatusChange(4)}><LocalShipping fontSize="small" sx={{ mr: 1 }} /> Cancelled</MenuItem>
  
      </Menu>
    </Box>
  );
};

export default Orders;
