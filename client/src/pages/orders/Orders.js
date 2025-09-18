import React, { useState, useEffect } from 'react';
import { Box, Typography, Menu, MenuItem, CircularProgress, Grid, Container, ButtonGroup, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { AccessTime, LocalDining, LocalShipping, Delete, GetApp, DateRange } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import 'date-fns';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
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
  const [deleting, setDeleting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

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

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    try {
      // Simple confirm prompt
      const confirmed = window.confirm(`Delete order #${selectedOrder.orderId?.slice(0,6) || selectedOrder.id}? This cannot be undone.`);
      if (!confirmed) return;
      setDeleting(true);
      const orderRef = doc(db, 'orders', selectedOrder.id);
      await deleteDoc(orderRef);
      handleMenuClose();
    } catch (e) {
      console.error('Error deleting order:', e);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportClick = () => {
    setExportDialogOpen(true);
  };

  const handleExportClose = () => {
    setExportDialogOpen(false);
    setDateRange({ startDate: null, endDate: null });
  };

  const exportToExcel = () => {
    // Prepare data for Excel
    const excelData = [];
    
    // Filter orders by date range if dates are selected
    const filteredOrders = orders.filter(order => {
      if (!dateRange.startDate && !dateRange.endDate) return true;
      
      const orderDate = order.createdAt ? new Date(order.createdAt) : null;
      if (!orderDate) return false;
      
      const startOfDay = dateRange.startDate ? new Date(dateRange.startDate.setHours(0, 0, 0, 0)) : null;
      const endOfDay = dateRange.endDate ? new Date(dateRange.endDate.setHours(23, 59, 59, 999)) : null;
      
      const afterStart = !startOfDay || orderDate >= startOfDay;
      const beforeEnd = !endOfDay || orderDate <= endOfDay;
      
      return afterStart && beforeEnd;
    });
    
    if (filteredOrders.length === 0) {
      alert('No orders found in the selected date range.');
      setExportDialogOpen(false);
      return;
    }

    filteredOrders.forEach(order => {
      // Calculate Stripe fee (2.9% + $0.30)
      const total = order.total || 0;
      const stripeFee = (total * 0.029) + 0.30;
      const totalAfterStripeFee = total - stripeFee;
      
      // Revenue split before Stripe fee allocation
      const tipAmount = order.tipAmount || 0;
      const deliveryFee = order.deliveryFee || 0;
      const fanMunchGrossRevenue = tipAmount + deliveryFee;
      const vendorGrossRevenue = total - fanMunchGrossRevenue;
      
      // Calculate percentage split for Stripe fee allocation
      const fanMunchPercentage = total > 0 ? fanMunchGrossRevenue / total : 0;
      const vendorPercentage = total > 0 ? vendorGrossRevenue / total : 0;
      
      // Allocate Stripe fee proportionally
      const fanMunchStripeFee = stripeFee * fanMunchPercentage;
      const vendorStripeFee = stripeFee * vendorPercentage;
      
      // Final revenue after Stripe fee allocation
      const fanMunchRevenue = fanMunchGrossRevenue - fanMunchStripeFee;
      const vendorRevenue = vendorGrossRevenue - vendorStripeFee;
      
      // Create order data with all items combined
      const orderData = {
        'Order ID': order.orderId || order.id,
        'User Name': order.userInfo?.userName || 'Unknown User',
        'Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown Date',
        'Total Amount': `₪${total.toFixed(2)}`,
        'Total Stripe Fee': `₪${stripeFee.toFixed(2)}`,
        'FanMunch Stripe Fee': `₪${fanMunchStripeFee.toFixed(2)}`,
        'Vendor Stripe Fee': `₪${vendorStripeFee.toFixed(2)}`,
        'Total After Stripe': `₪${totalAfterStripeFee.toFixed(2)}`,
        'Subtotal': `₪${order.subtotal || 0}`,
        'Delivery Fee (Gross)': `₪${deliveryFee.toFixed(2)}`,
        'Tip Amount (Gross)': `₪${tipAmount.toFixed(2)}`,
        'FanMunch Gross Revenue': `₪${fanMunchGrossRevenue.toFixed(2)}`,
        'FanMunch Revenue %': `${(fanMunchPercentage * 100).toFixed(1)}%`,
        'FanMunch Net Revenue': `₪${fanMunchRevenue.toFixed(2)}`,
        'Vendor Gross Revenue': `₪${vendorGrossRevenue.toFixed(2)}`,
        'Vendor Revenue %': `${(vendorPercentage * 100).toFixed(1)}%`,
        'Vendor Net Revenue': `₪${vendorRevenue.toFixed(2)}`,
        'Status': Order.getStatusText(order.status),
        'Seat Info': order.seatInfo ? `Section ${order.seatInfo.section || ''}, Row ${order.seatInfo.row || ''}, Seat ${order.seatInfo.seatNo || ''}`.trim() : 'No seat info',
      };

      // Add items information
      if (order.cart && order.cart.length > 0) {
        // Format items as 'name: qty, name: qty'
        const itemsList = order.cart.map(item => {
          const name = item.name || 'Unknown Item';
          const qty = item.quantity || 1;
          return `${name}: ${qty}`;
        }).join(', ');
        
        // Calculate total quantity
        const totalQuantity = order.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        orderData['Items'] = itemsList;
        orderData['Total Items'] = totalQuantity;
      } else {
        orderData['Items'] = 'No items';
        orderData['Total Items'] = 0;
      }
      
      excelData.push(orderData);
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    
    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const filename = `orders_export_${today}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
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
    // Convert status text to numeric status
    const statusMap = {
      'all': 'all',
      'pending': '0',
      'preparing': '1',
      'delivering': '2',
      'delivered': '3',
      'cancelled': '4'
    };
    setSelectedFilter(statusMap[status] || 'all');
  };

  if (loading) {
    return <Box className="loading-container"><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Centered Filter Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
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
                bgcolor: selectedFilter === '3' ? 'primary.main' : 'white',
                color: selectedFilter === '3' ? 'white' : 'primary.main',
                '&:hover': {
                  bgcolor: selectedFilter === '3' ? 'primary.dark' : 'grey.100'
                }
              }}
            >
              Delivered
            </Button>
            <Button 
              onClick={() => filterOrders('cancelled')}
              sx={{ 
                bgcolor: selectedFilter === '4' ? 'primary.main' : 'white',
                color: selectedFilter === '4' ? 'white' : 'primary.main',
                '&:hover': {
                  bgcolor: selectedFilter === '4' ? 'primary.dark' : 'grey.100'
                }
              }}
            >
              Cancelled
            </Button>
          </ButtonGroup>
          <Button
            variant="contained"
            color="primary"
            startIcon={<GetApp />}
            onClick={handleExportClick}
            sx={{ ml: 2 }}
          >
            Export to Excel
          </Button>
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
                  getStatusColor={getStatusColor}
                />
              </Grid>
            ))}
        </Grid>

        <OrderDetails
          order={selectedOrder}
          open={dialogOpen}
          onClose={closeDialog}
          restaurantName={shopData?.name || 'Restaurant'}
        />

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => handleStatusChange(0)}><AccessTime fontSize="small" sx={{ mr: 1 }} /> Pending</MenuItem>
          <MenuItem onClick={() => handleStatusChange(1)}><LocalDining fontSize="small" sx={{ mr: 1 }} /> Preparing</MenuItem>
          <MenuItem onClick={() => handleStatusChange(2)}><LocalShipping fontSize="small" sx={{ mr: 1 }} /> Delivering</MenuItem>
          <MenuItem onClick={() => handleStatusChange(3)}><LocalShipping fontSize="small" sx={{ mr: 1 }} /> Delivered</MenuItem>
          <MenuItem onClick={handleDeleteOrder} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} /> {deleting ? 'Deleting...' : 'Delete Order'}
          </MenuItem>
        </Menu>

        <Dialog open={exportDialogOpen} onClose={handleExportClose}>
          <DialogTitle>Export Orders</DialogTitle>
          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300, mt: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, startDate: newValue }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, endDate: newValue }))}
                  minDate={dateRange.startDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <Typography variant="caption" color="textSecondary">
                  Leave dates empty to export all orders
                </Typography>
              </Box>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleExportClose}>Cancel</Button>
            <Button 
              onClick={() => {
                exportToExcel();
                handleExportClose();
              }} 
              variant="contained"
              color="primary"
            >
              Export
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Orders;
