import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Menu, MenuItem, CircularProgress, Grid, Container, ButtonGroup, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Select, FormControl, InputLabel } from '@mui/material';
import { AccessTime, LocalDining, LocalShipping, Delete, GetApp, DateRange } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import 'date-fns';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from '../../config/firebase';
import Order from '../../models/Order';
import OrderCard from './components/OrderCard';
import OrderDetails from './components/OrderDetails';
import OrderFilters from './components/OrderFilters';
import './Orders.css';

const Orders = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [allShops, setAllShops] = useState([]);
  const [selectedShopFilter, setSelectedShopFilter] = useState('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [dateFilterDialogOpen, setDateFilterDialogOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(new Date().setHours(0, 0, 0, 0)), // Today at midnight
    endDate: new Date(new Date().setHours(23, 59, 59, 999)) // Today at end of day
  });

  // Get shop data from localStorage
  useEffect(() => {
    const savedShopData = localStorage.getItem('currentShopData');
    if (savedShopData) {
      setShopData(JSON.parse(savedShopData));
    }
  }, []);

  // Fetch all shops for the dropdown
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const shopsRef = collection(db, 'shops');
        const shopsSnap = await getDocs(shopsRef);
        const shopsList = shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllShops(shopsList);
      } catch (error) {
        console.error('Error fetching shops:', error);
      }
    };
    fetchShops();
  }, []);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    let q;

    // Build query with shop filter
    if (selectedShopFilter === 'all') {
      q = query(ordersRef);
    } else {
      q = query(ordersRef, where('shopId', '==', selectedShopFilter));
    }

    setLoading(true);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => {
        const data = doc.data();
        const order = Order.fromFirestore(data);
        return { id: doc.id, ...order };
      });
      
      // Filter by date range on client side
      const filteredOrders = ordersList.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        return orderDate >= selectedDateRange.startDate && orderDate <= selectedDateRange.endDate;
      });
      
      setOrders(filteredOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedShopFilter, selectedDateRange]);



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
      const confirmed = window.confirm(
        `${t('common.deleteConfirm', { item: `#${selectedOrder.orderId?.slice(0,6) || selectedOrder.id}` })} ${t('common.cannotBeUndone')}`
      );
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
        [t('orders.export.orderId')]: order.orderId || order.id,
        [t('orders.export.userName')]: order.userInfo?.userName || t('common.unknownUser'),
        [t('common.date')]: order.createdAt ? new Date(order.createdAt).toLocaleDateString(i18n.language) : t('common.unknownDate'),
        [t('orders.export.totalAmount')]: `₪${total.toFixed(2)}`,
        [t('orders.export.totalStripeFee')]: `₪${stripeFee.toFixed(2)}`,
        [t('orders.export.fanMunchStripeFee')]: `₪${fanMunchStripeFee.toFixed(2)}`,
        [t('orders.export.vendorStripeFee')]: `₪${vendorStripeFee.toFixed(2)}`,
        [t('orders.export.totalAfterStripe')]: `₪${totalAfterStripeFee.toFixed(2)}`,
        [t('orders.export.subtotal')]: `₪${order.subtotal || 0}`,
        [t('orders.export.deliveryFee')]: `₪${deliveryFee.toFixed(2)}`,
        [t('orders.export.tipAmount')]: `₪${tipAmount.toFixed(2)}`,
        [t('orders.export.fanMunchGross')]: `₪${fanMunchGrossRevenue.toFixed(2)}`,
        [t('orders.export.fanMunchPercent')]: `${(fanMunchPercentage * 100).toFixed(1)}%`,
        [t('orders.export.fanMunchNet')]: `₪${fanMunchRevenue.toFixed(2)}`,
        [t('orders.export.vendorGross')]: `₪${vendorGrossRevenue.toFixed(2)}`,
        [t('orders.export.vendorPercent')]: `${(vendorPercentage * 100).toFixed(1)}%`,
        [t('orders.export.vendorNet')]: `₪${vendorRevenue.toFixed(2)}`,
        [t('common.status')]: t(`orderStatus.${order.status}`),
        [t('orders.export.seatInfo')]: order.seatInfo ? 
          `${t('orders.export.section')} ${order.seatInfo.section || ''}, ${t('orders.export.row')} ${order.seatInfo.row || ''}, ${t('orders.export.seat')} ${order.seatInfo.seatNo || ''}`.trim() 
          : t('orders.export.noSeatInfo'),
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
    
    // Add worksheet to workbook with translated title
    XLSX.utils.book_append_sheet(wb, ws, t('orders.title'));
    
    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const filename = `${t('orders.export.filename')}_${today}.xlsx`;
    
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
    <Container maxWidth="lg" dir={isRTL ? 'rtl' : 'ltr'}>
      <Box sx={{ py: 4 }}>
        {/* Filters Row */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Shop Filter Dropdown */}
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Filter by Shop</InputLabel>
            <Select
              value={selectedShopFilter}
              label="Filter by Shop"
              onChange={(e) => setSelectedShopFilter(e.target.value)}
            >
              <MenuItem value="all">All Shops</MenuItem>
              {allShops.map((shop) => (
                <MenuItem key={shop.id} value={shop.id}>
                  {shop.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Range Quick Filters */}
          <ButtonGroup variant="outlined" size="medium">
            <Button 
              onClick={() => {
                const today = new Date();
                setSelectedDateRange({
                  startDate: new Date(today.setHours(0, 0, 0, 0)),
                  endDate: new Date(today.setHours(23, 59, 59, 999))
                });
              }}
            >
              Today
            </Button>
            <Button 
              onClick={() => {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                setSelectedDateRange({
                  startDate: new Date(yesterday.setHours(0, 0, 0, 0)),
                  endDate: new Date(yesterday.setHours(23, 59, 59, 999))
                });
              }}
            >
              Yesterday
            </Button>
            <Button 
              onClick={() => {
                const today = new Date();
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                setSelectedDateRange({
                  startDate: new Date(weekAgo.setHours(0, 0, 0, 0)),
                  endDate: new Date(today.setHours(23, 59, 59, 999))
                });
              }}
            >
              Last 7 Days
            </Button>
            <Button 
              onClick={() => setDateFilterDialogOpen(true)}
              startIcon={<DateRange />}
            >
              Custom Range
            </Button>
          </ButtonGroup>

          {/* Current Date Range Display */}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Showing: {selectedDateRange.startDate.toLocaleDateString()} - {selectedDateRange.endDate.toLocaleDateString()}
          </Typography>
        </Box>

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
              {t('orders.filters.all')}
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
              {t('orders.filters.pending')}
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
              {t('orders.filters.preparing')}
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
              {t('orders.filters.delivering')}
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
              {t('orders.filters.delivered')}
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
              {t('orders.filters.cancelled')}
            </Button>
          </ButtonGroup>
          <Button
            variant="contained"
            color="primary"
            startIcon={<GetApp />}
            onClick={handleExportClick}
            sx={{ ml: 2 }}
          >
            {t('orders.export.title')}
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
            .map((order) => {
              const shop = allShops.find(s => s.id === order.shopId);
              return (
                <Grid item xs={12} sm={6} md={4} key={order.id}>
                  <OrderCard
                    order={order}
                    onViewDetails={openDialog}
                    onMenuClick={handleMenuClick}
                    getStatusColor={getStatusColor}
                    shopName={shop?.name}
                  />
                </Grid>
              );
            })}
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

        {/* Custom Date Range Filter Dialog */}
        <Dialog open={dateFilterDialogOpen} onClose={() => setDateFilterDialogOpen(false)}>
          <DialogTitle>Select Date Range</DialogTitle>
          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300, mt: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={selectedDateRange.startDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setSelectedDateRange(prev => ({ 
                        ...prev, 
                        startDate: new Date(newValue.setHours(0, 0, 0, 0))
                      }));
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={selectedDateRange.endDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setSelectedDateRange(prev => ({ 
                        ...prev, 
                        endDate: new Date(newValue.setHours(23, 59, 59, 999))
                      }));
                    }
                  }}
                  minDate={selectedDateRange.startDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDateFilterDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Export Dialog */}
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
