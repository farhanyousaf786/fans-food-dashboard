import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, IconButton, Menu, MenuItem, CircularProgress,
  Card, CardContent, CardMedia, Grid, CardActions, Button, Stack,
  Divider, Avatar, FormControl, InputLabel, Select, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import {
  MoreVert, AccessTime, LocalDining, Payment, LocalShipping,
  ShoppingCart, Person, LocationOn
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [restaurantNames, setRestaurantNames] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef);

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

  useEffect(() => {
    const fetchRestaurantNames = async () => {
      const newNames = { ...restaurantNames };
      for (const order of orders) {
        if (order.restaurant && typeof order.restaurant === 'object' && !newNames[order.restaurant?.path]) {
          try {
            const restaurantRef = doc(db, order.restaurant.path);
            const snapshot = await getDoc(restaurantRef);
            newNames[order.restaurant.path] = snapshot.exists() ? snapshot.data().name : 'Unknown Restaurant';
          } catch {
            newNames[order.restaurant.path] = 'Unknown Restaurant';
          }
        }
      }
      setRestaurantNames(newNames);
    };

    if (orders.length > 0) fetchRestaurantNames();
  }, [orders]);

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
    return <Box sx={{ display: 'flex', justifyContent: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h4" fontWeight="600">Orders Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="0">Pending</MenuItem>
              <MenuItem value="1">Accepted</MenuItem>
              <MenuItem value="2">Preparing</MenuItem>
              <MenuItem value="3">Ready</MenuItem>
              <MenuItem value="4">Delivered</MenuItem>
              <MenuItem value="5">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort</InputLabel>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort">
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="total">Total</MenuItem>
              <MenuItem value="items">Items</MenuItem>
            </Select>
          </FormControl>
        </Box>
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
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">#{order.id.slice(0, 6)}</Typography>
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, order)}>
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                    <Chip label={Order.getStatusText(order.status)} color={getStatusColor(order.status)} size="small" />
                    <Chip icon={<Payment fontSize="small" />} label={Order.getPaymentMethodText(order.paymentMethod)} size="small" />
                  </Box>
                  <Typography variant="body2">
                    <ShoppingCart fontSize="small" /> {order.cart?.length || 0} items
                  </Typography>
                  <Typography variant="subtitle1" color="primary">${order.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    <LocationOn fontSize="small" /> {restaurantNames[order.restaurant?.path] || 'Restaurant'}
                  </Typography>
                  <Button
                    size="small"
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => openDialog(order)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* POPUP DIALOG */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Order Details</DialogTitle>
        {selectedOrder && (
          <DialogContent dividers>
            <Typography variant="subtitle2" gutterBottom>Items:</Typography>
            {selectedOrder.cart?.map((item, i) => (
              <Box key={i} sx={{ display: 'flex', mb: 1 }}>
                <Avatar src={item.images?.[0]} variant="rounded" sx={{ width: 40, height: 40, mr: 2 }} />
                <Box>
                  <Typography>{item.name}</Typography>
                  <Typography variant="caption">${item.price} × {item.quantity || 1}</Typography>
                </Box>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Price Breakdown</Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Subtotal</Typography><Typography>${selectedOrder.subtotal}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Delivery Fee</Typography><Typography>${selectedOrder.deliveryFee}</Typography>
              </Box>
              {selectedOrder.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="success.main">Discount</Typography>
                  <Typography color="success.main">-${selectedOrder.discount}</Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight="bold">Total</Typography>
                <Typography color="primary" fontWeight="bold">${selectedOrder.total}</Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">Delivery Info</Typography>
            <Box sx={{ mt: 1 }}>
              <Typography><Person fontSize="small" /> {selectedOrder.customerName || 'Customer'}</Typography>
              <Typography><LocationOn fontSize="small" /> {restaurantNames[selectedOrder.restaurant?.path]}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Created: {new Date(selectedOrder.createdAt).toLocaleString()}
            </Typography>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* MENU */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleStatusChange(1)}><AccessTime fontSize="small" sx={{ mr: 1 }} /> Accept</MenuItem>
        <MenuItem onClick={() => handleStatusChange(2)}><LocalDining fontSize="small" sx={{ mr: 1 }} /> Prepare</MenuItem>
        <MenuItem onClick={() => handleStatusChange(3)}><LocalShipping fontSize="small" sx={{ mr: 1 }} /> Ready</MenuItem>
        <MenuItem onClick={() => handleStatusChange(4)}><LocalShipping fontSize="small" sx={{ mr: 1 }} /> Delivered</MenuItem>
        <MenuItem onClick={() => handleStatusChange(5)} sx={{ color: 'error.main' }}>
          <LocalShipping fontSize="small" sx={{ mr: 1 }} /> Cancel
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Orders;
