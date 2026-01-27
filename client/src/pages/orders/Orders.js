import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Menu, MenuItem, CircularProgress, Grid, Container, ButtonGroup, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Select, FormControl, InputLabel, FormControlLabel, Checkbox, Radio, RadioGroup, FormLabel } from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import { AccessTime, LocalDining, LocalShipping, Delete, GetApp, DateRange } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import 'date-fns';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from '../../config/firebase';
import Order from '../../models/Order';
import PickUpPoint from '../../models/PickUpPoint';
import OrderCard from './components/OrderCard';
import OrderDetails from './components/OrderDetails';
import OrderFilters from './components/OrderFilters';
import './Orders.css';

const Orders = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [dateFilterDialogOpen, setDateFilterDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(new Date().setHours(0, 0, 0, 0)), // Today at midnight
    endDate: new Date(new Date().setHours(23, 59, 59, 999)) // Today at end of day
  });

  // Export state
  const [exportFormat, setExportFormat] = useState('admin'); // 'admin', 'vendor', 'field_manager', 'delivery_personnel'
  const [exportShopId, setExportShopId] = useState('all');
  const [userRole, setUserRole] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [deliveryUsers, setDeliveryUsers] = useState({});
  const [pickupPoints, setPickupPoints] = useState({}); // Store pickup points by ID
  const [includeAvgSpending, setIncludeAvgSpending] = useState(false);
  const [includeProductStats, setIncludeProductStats] = useState(false);
  const [includeDailyBreakdown, setIncludeDailyBreakdown] = useState(false);

  const getCurrencySymbol = (curr) => {
    if (curr === 'ILS' || curr === 'NIS') return '₪';
    if (curr === 'USD') return '$';
    if (curr === 'EUR') return '€';
    if (curr === 'GBP') return '£';
    return curr || '$';
  };

  const getNameString = (val) => {
    if (!val) return 'N/A';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val[i18n.language] || val['en'] || val['he'] || Object.values(val)[0] || 'N/A';
    }
    return String(val);
  };

  // Get user role and shop data
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      setCurrentUser(user);
      setUserRole(user.role);

      // If shop owner, set default export shop to their shop AND set the main filter
      if (user.role === 'shopowner') {
        // We might need to fetch their shop ID if not in user object
        // Assuming user.shopId or we find it from shops collection
        setExportFormat('vendor');

        // Try to get shop ID from currentShopData
        const savedShopData = localStorage.getItem('currentShopData');
        if (savedShopData) {
          const shopData = JSON.parse(savedShopData);
          setShopData(shopData);
          // FORCE filter to this shop
          setSelectedShopFilter(shopData.id);
          setExportShopId(shopData.id);
        }
      } else if (user.role === 'admin') {
        // For admin, check if we have currentShopData (from stadium page)
        const savedShopData = localStorage.getItem('currentShopData');
        if (savedShopData) {
          const shopData = JSON.parse(savedShopData);
          setShopData(shopData);
          // Filter by stadium - get all shops in this stadium
          setSelectedShopFilter('stadium'); // Special value for stadium filtering
        }
      }
    }
  }, []);

  // Fetch all shops for the dropdown
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const shopsRef = collection(db, 'shops');
        let shopsQuery;

        // Only fetch shops from the current stadium
        if (shopData?.stadiumId) {
          shopsQuery = query(shopsRef, where('stadiumId', '==', shopData.stadiumId));
        } else {
          shopsQuery = query(shopsRef); // Fallback to all shops if no stadium context
        }

        const shopsSnap = await getDocs(shopsQuery);
        const shopsList = shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllShops(shopsList);
      } catch (error) {
        console.error('Error fetching shops:', error);
      }
    };
    fetchShops();
  }, [shopData]);

  // Fetch delivery users
  useEffect(() => {
    const fetchDeliveryUsers = async () => {
      try {
        const deliveryUsersRef = collection(db, 'deliveryUsers');
        const deliveryUsersSnap = await getDocs(deliveryUsersRef);
        const deliveryUsersMap = {};
        deliveryUsersSnap.docs.forEach(doc => {
          deliveryUsersMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        setDeliveryUsers(deliveryUsersMap);
        console.log('🔍 Sample Delivery User Data:', deliveryUsersMap[Object.keys(deliveryUsersMap)[0]]);
        console.log('✅ Fetched delivery users:', Object.keys(deliveryUsersMap).length);
      } catch (error) {
        console.error('Error fetching delivery users:', error);
      }
    };
    fetchDeliveryUsers();
  }, []);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    let q;

    // Build query with shop filter
    if (selectedShopFilter === 'stadium' && shopData?.stadiumId) {
      // Filter by stadium for admin users
      q = query(ordersRef, where('stadiumId', '==', shopData.stadiumId));
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
  }, [selectedShopFilter, selectedDateRange, shopData]);

  // Fetch pickup points for orders with pickupId
  useEffect(() => {
    const fetchPickupPoints = async () => {
      const pickupIds = [...new Set(
        orders
          .filter(order => order.pickupId)
          .map(order => order.pickupId)
      )];

      if (pickupIds.length === 0) return;

      const newPickupPoints = { ...pickupPoints };

      for (const pickupId of pickupIds) {
        // Skip if already fetched
        if (newPickupPoints[pickupId]) continue;

        try {
          const pickupRef = doc(db, 'pickupPoints', pickupId);
          const pickupSnap = await getDoc(pickupRef);

          if (pickupSnap.exists()) {
            const pickupPoint = PickUpPoint.fromFirestore(pickupSnap, pickupSnap.id);
            newPickupPoints[pickupId] = pickupPoint;
          }
        } catch (error) {
          console.error(`Error fetching pickup point ${pickupId}:`, error);
        }
      }

      setPickupPoints(newPickupPoints);
    };

    fetchPickupPoints();
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

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    try {
      const confirmed = window.confirm(
        `${t('common.deleteConfirm', { item: `#${selectedOrder.orderId?.slice(0, 6) || selectedOrder.id}` })} ${t('common.cannotBeUndone')}`
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
    // Get unique dates from orders
    const uniqueDates = [...new Set(
      orders
        .filter(order => order.createdAt)
        .map(order => new Date(order.createdAt).toLocaleDateString())
    )].sort((a, b) => new Date(a) - new Date(b));

    setAvailableDates(uniqueDates);
    setSelectedDates(uniqueDates); // Select all dates by default

    // Set default shop for export based on current filter
    setExportShopId(selectedShopFilter);

    setExportDialogOpen(true);
  };

  const handleExportClose = () => {
    setExportDialogOpen(false);
    setAvailableDates([]);
    setSelectedDates([]);
  };

  const exportToExcel = () => {
    // 1. Filter orders by selected dates
    let filteredOrders = orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt).toLocaleDateString();
      return selectedDates.includes(orderDate);
    });

    // 2. Filter by Shop (if specific shop selected for export)
    if (exportShopId !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.shopId === exportShopId);
    }

    if (filteredOrders.length === 0) {
      alert('No orders found for the selected criteria.');
      return;
    }

    // Sort orders by date
    const sortedOrders = filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Group orders by date
    const ordersByDate = {};
    sortedOrders.forEach(order => {
      const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown Date';
      if (!ordersByDate[date]) {
        ordersByDate[date] = [];
      }
      ordersByDate[date].push(order);
    });

    // Prepare data for Excel
    const excelData = [];
    let rowNumber = 1;



    Object.keys(ordersByDate).forEach(date => {
      // Add spacing between dates
      if (Object.keys(ordersByDate).indexOf(date) > 0) {
        excelData.push({});
        excelData.push({});
      }

      const dayOrders = ordersByDate[date];

      // --- CALCULATE DAILY TOTALS (Only for Admin View usually, but useful to have) ---
      // We'll only add the detailed daily summary row for Admin view to keep others clean
      if (exportFormat === 'admin') {
        const dayTotal = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const daySubtotal = dayOrders.reduce((sum, order) => sum + (order.subtotal || 0), 0);
        const dayDeliveryFee = dayOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
        const dayTipGross = dayOrders.reduce((sum, order) => sum + (order.tipAmount || 0), 0);
        const dayStripeFee = dayOrders.reduce((sum, order) => sum + ((order.total || 0) * 0.029 + 0.30), 0);
        const dayFanMunchGross = dayTipGross + dayDeliveryFee;
        const dayVendorGross = dayTotal - dayFanMunchGross;
        const dayFanMunchStripeFee = dayStripeFee * (dayTotal > 0 ? dayFanMunchGross / dayTotal : 0);
        const dayVendorStripeFee = dayStripeFee - dayFanMunchStripeFee;
        const dayFanMunchNet = dayFanMunchGross - dayFanMunchStripeFee;
        const dayVendorNet = dayVendorGross - dayVendorStripeFee;
        const dayTotalPayout = dayTotal - dayStripeFee;

        const getCurrencySymbol = (curr) => {
          if (curr === 'ILS' || curr === 'NIS') return '₪';
          if (curr === 'USD') return '$';
          if (curr === 'EUR') return '€';
          if (curr === 'GBP') return '£';
          return curr || '$';
        };
        const cs = dayOrders.length > 0 ? getCurrencySymbol(dayOrders[0].currency) : '₪';

        excelData.push({
          'Date': `${date} - Daily Totals (${dayOrders.length} orders)`,
          'Order ID': '',
          'User Name': '',
          'Seat Info': '',
          'Items': '',
          'Total Items': '',
          'Customer Total Payment': `${cs}${dayTotal.toFixed(2)}`,
          'Order Subtotal': `${cs}${daySubtotal.toFixed(2)}`,
          'Delivery Fee': `${cs}${dayDeliveryFee.toFixed(2)}`,
          'Tip Gross': `${cs}${dayTipGross.toFixed(2)}`,
          'Total Stripe Fee': `${cs}${dayStripeFee.toFixed(2)}`,
          'FanMunch Stripe Fee': `${cs}${dayFanMunchStripeFee.toFixed(2)}`,
          'Vendor Stripe Fee': `${cs}${dayVendorStripeFee.toFixed(2)}`,
          'Total Payout': `${cs}${dayTotalPayout.toFixed(2)}`,
          'FanMunch Gross Revenue': `${cs}${dayFanMunchGross.toFixed(2)}`,
          'FanMunch Net Revenue': `${cs}${dayFanMunchNet.toFixed(2)}`,
          'Vendor Gross Revenue': `${cs}${dayVendorGross.toFixed(2)}`,
          'Vendor Net Revenue': `${cs}${dayVendorNet.toFixed(2)}`,
          'Row #': ''
        });
        rowNumber++;
      }

      // --- ADD INDIVIDUAL ORDERS ---
      dayOrders.forEach(order => {
        // Common Calculations
        const total = order.total || 0;
        const tipAmount = order.tipAmount || 0;
        const deliveryFee = order.deliveryFee || 0;
        const stripeFee = (total * 0.029) + 0.30;
        const totalAfterStripeFee = total - stripeFee;

        // Revenue splits
        const fanMunchGrossRevenue = tipAmount + deliveryFee;
        const vendorGrossRevenue = total - fanMunchGrossRevenue;

        const fanMunchPercentage = total > 0 ? fanMunchGrossRevenue / total : 0;
        const vendorPercentage = total > 0 ? vendorGrossRevenue / total : 0;

        const fanMunchStripeFee = stripeFee * fanMunchPercentage;
        const vendorStripeFee = stripeFee * vendorPercentage;

        const fanMunchRevenue = fanMunchGrossRevenue - fanMunchStripeFee;
        const vendorRevenue = vendorGrossRevenue - vendorStripeFee;

        // Items String
        let itemsList = '';
        let totalQuantity = 0;
        if (order.cart && order.cart.length > 0) {
          itemsList = order.cart.map(item => {
            const getNameString = (val) => {
              if (!val) return 'Unknown';
              if (typeof val === 'string') return val;
              return val.en || val.he || val.name || val.description || 'Unknown';
            };
            const name = getNameString(item.name);
            const qty = item.quantity || 1;
            totalQuantity += qty;

            let itemStr = `${name} (x${qty})`;

            // Add options if any
            if (item.selectedOptions && item.selectedOptions.length > 0) {
              const opts = item.selectedOptions.map(o => getNameString(o)).join('/');
              itemStr += ` [${opts}]`;
            }

            // Add combo breakdown if any
            if (item.isCombo && item.comboSelectedOption) {
              const comboItems = item.comboSelectedOption.map(si => getNameString(si.itemName)).join(' + ');
              itemStr += ` {${comboItems}}`;
            }

            return itemStr;
          }).join(', ');
        } else {
          itemsList = 'No items';
        }

        // Location Info - Display based on delivery type
        let locationStr = 'No location info';
        const deliveryType = order.deliveryType || 'inside'; // Default to inside if not specified

        const getNameString = (val) => {
          if (!val) return '';
          if (typeof val === 'string') return val;
          return val.en || val.he || val.name || val.description || '';
        };

        if (deliveryType === 'outside') {
          // Outside delivery - show outside delivery data
          if (order.outsideDelivery?.location) {
            locationStr = `Outside: ${getNameString(order.outsideDelivery.location)}`;
          } else if (order.seatInfo) {
            // Fallback to seat info if outsideDelivery is not available
            const parts = [];
            const si = order.seatInfo;
            if (si.section) parts.push(`Sec ${si.section}`);
            if (si.row) parts.push(`Row ${si.row}`);
            if (si.seatNo) parts.push(`Seat ${si.seatNo}`);
            if (si.entrance) parts.push(`Entrance ${si.entrance}`);
            locationStr = parts.length > 0 ? `Outside: ${parts.join(', ')}` : 'Outside Delivery';
          } else {
            locationStr = 'Outside Delivery';
          }
        } else if (deliveryType === 'pickup') {
          // Pickup - show pickup point data fetched via pickupId
          if (order.pickupId && pickupPoints[order.pickupId]) {
            const pickupPoint = pickupPoints[order.pickupId];
            locationStr = `Pickup: ${getNameString(pickupPoint.name)}`;
            // Optionally add area or location details
            if (pickupPoint.area) {
              locationStr += ` (${getNameString(pickupPoint.area)})`;
            }
          } else if (order.pickupId) {
            // pickupId exists but not yet loaded
            locationStr = 'Pickup Order (Loading...)';
          } else {
            locationStr = 'Pickup Order';
          }
        } else {
          // Inside delivery - show inside delivery data
          if (order.insideDelivery?.location) {
            locationStr = getNameString(order.insideDelivery.location);
          } else if (order.seatInfo) {
            const parts = [];
            const si = order.seatInfo;
            if (si.room) parts.push(`Room ${si.room}`);
            if (si.floor) parts.push(`Floor ${si.floor}`);
            if (si.stand) parts.push(`Stand ${si.stand}`);
            if (si.area) parts.push(`Area ${si.area}`);
            if (si.section) parts.push(`Sec ${si.section}`);
            if (si.row) parts.push(`Row ${si.row}`);
            if (si.seatNo) parts.push(`Seat ${si.seatNo}`);
            if (si.entrance) parts.push(`Entrance ${si.entrance}`);
            locationStr = parts.join(', ') || 'Inside Delivery';
          } else {
            locationStr = 'Inside Delivery';
          }
        }

        // --- GENERATE ROW BASED ON FORMAT ---
        let orderRow = {};

        const getCurrencySymbol = (curr) => {
          if (curr === 'ILS' || curr === 'NIS') return '₪';
          if (curr === 'USD') return '$';
          if (curr === 'EUR') return '€';
          if (curr === 'GBP') return '£';
          return curr || '$';
        };
        const cs = getCurrencySymbol(order.currency);

        if (exportFormat === 'vendor') {
          // Vendor: Date, Order ID, Name, Total $ of order, Product name, Net Profit, Gross profit
          orderRow = {
            'Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
            'Order ID': order.orderId || order.id || '',
            'Customer Name': order.userInfo?.userName || 'Unknown User',
            'Total Order Value': `${cs}${total.toFixed(2)}`,
            'Product Names': itemsList,
            'Vendor Gross Profit': `${cs}${vendorGrossRevenue.toFixed(2)}`,
            'Vendor Net Profit': `${cs}${vendorRevenue.toFixed(2)}`
          };
        } else if (exportFormat === 'field_manager') {
          // Field manager: Date, Order ID, Name, Total $ of order, Product name, Tip, Delivery guy name.
          const deliveryUser = order.deliveryUserId ? deliveryUsers[order.deliveryUserId] : null;
          const deliveryName = deliveryUser ? `${deliveryUser.firstName || ''} ${deliveryUser.lastName || ''}`.trim() : 'Unassigned';

          orderRow = {
            'Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
            'Order ID': order.orderId || order.id || '',
            'Customer Name': order.userInfo?.userName || 'Unknown User',
            'Location': locationStr,
            'Total Order Value': `${cs}${total.toFixed(2)}`,
            'Product Names': itemsList,
            'Tip': `${cs}${tipAmount.toFixed(2)}`,
            'Delivery Guy Name': deliveryName
          };
        } else if (exportFormat === 'delivery_personnel') {
          // Delivery Personnel: Date, Order ID, Delivery Person Name, Email, Tip Amount, Total Order Value

          // Try multiple possible field names for delivery user ID
          const deliveryUserId = order.deliveryUserId || order.deliveryUserID || order.deliveryUser || order.assignedDeliveryUser;
          const deliveryUser = deliveryUserId ? deliveryUsers[deliveryUserId] : null;

          // Debug first order
          if (rowNumber === 1) {
            console.log('🔍 First Order Delivery Data:', {
              deliveryUserId: order.deliveryUserId,
              foundUser: deliveryUser,
              totalDeliveryUsers: Object.keys(deliveryUsers).length
            });
          }

          const deliveryName = deliveryUser ? `${deliveryUser.firstName || ''} ${deliveryUser.lastName || ''}`.trim() : 'Unassigned';
          const deliveryEmail = deliveryUser?.email || 'N/A';

          orderRow = {
            'Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
            'Order ID': order.orderId || order.id || '',
            'Delivery Person Name': deliveryName,
            'Delivery Person Email': deliveryEmail,
            'Customer Name': order.userInfo?.userName || 'Unknown User',
            'Location': locationStr,
            'Total Order Value': `${cs}${total.toFixed(2)}`,
            'Tip Amount': `${cs}${tipAmount.toFixed(2)}`,
            'Delivery Fee': `${cs}${deliveryFee.toFixed(2)}`,
            'Product Names': itemsList
          };
        } else {
          // Admin: Everything (Original Format)
          orderRow = {
            'Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
            'Order ID': order.orderId || order.id || '',
            'User Name': order.userInfo?.userName || 'Unknown User',
            'Location': locationStr,
            'Items': itemsList,
            'Total Items': totalQuantity,
            'Customer Total Payment': `${cs}${total.toFixed(2)}`,
            'Order Subtotal': `${cs}${(order.subtotal || 0).toFixed(2)}`,
            'Delivery Fee': `${cs}${deliveryFee.toFixed(2)}`,
            'Tip Gross': `${cs}${tipAmount.toFixed(2)}`,
            'Total Stripe Fee': `${cs}${stripeFee.toFixed(2)}`,
            'FanMunch Stripe Fee': `${cs}${fanMunchStripeFee.toFixed(2)}`,
            'Vendor Stripe Fee': `${cs}${vendorStripeFee.toFixed(2)}`,
            'Total Payout': `${cs}${totalAfterStripeFee.toFixed(2)}`,
            'FanMunch Gross Revenue': `${cs}${fanMunchGrossRevenue.toFixed(2)}`,
            'FanMunch Net Revenue': `${cs}${fanMunchRevenue.toFixed(2)}`,
            'Vendor Gross Revenue': `${cs}${vendorGrossRevenue.toFixed(2)}`,
            'Vendor Net Revenue': `${cs}${vendorRevenue.toFixed(2)}`,
            'Row #': rowNumber
          };
        }

        excelData.push(orderRow);
        rowNumber++;
      });

      // --- DAILY STATS BREAKDOWN ---
      if (includeDailyBreakdown && (includeAvgSpending || includeProductStats)) {
        const dailyCS = dayOrders.length > 0 ? getCurrencySymbol(dayOrders[0].currency) : '₪';

        excelData.push({});

        if (includeAvgSpending) {
          excelData.push({
            'Date': `=== DAILY STATS (${date}) ===`
          });

          const userSpending = {};
          let totalRevenue = 0;
          let totalOrders = 0;

          dayOrders.forEach(order => {
            const userId = order.userInfo?.userId || order.userInfo?.userEmail || order.userInfo?.userPhoneNo || `Unknown-${order.id}`;
            const userName = order.userInfo?.userName || 'Unknown User';

            if (!userSpending[userId]) {
              userSpending[userId] = {
                name: userName,
                spent: 0,
                orders: 0
              };
            }

            const orderTotal = order.total || 0;
            userSpending[userId].spent += orderTotal;
            userSpending[userId].orders += 1;
            totalRevenue += orderTotal;
            totalOrders += 1;
          });

          const uniqueUsersCount = Object.keys(userSpending).length;
          const avgSpendingPerUser = uniqueUsersCount > 0 ? totalRevenue / uniqueUsersCount : 0;
          const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
          const repeatingUsersCount = Object.values(userSpending).filter(u => u.orders > 1).length;

          excelData.push({
            'Date': 'Total Revenue',
            'Order ID': `${dailyCS}${totalRevenue.toFixed(2)}`
          });

          excelData.push({
            'Date': 'Total Orders',
            'Order ID': totalOrders
          });

          excelData.push({
            'Date': 'Unique Users',
            'Order ID': uniqueUsersCount
          });

          excelData.push({
            'Date': 'Repeating Users',
            'Order ID': repeatingUsersCount
          });

          excelData.push({
            'Date': 'Avg Spending/User',
            'Order ID': `${dailyCS}${avgSpendingPerUser.toFixed(2)}`
          });

          excelData.push({
            'Date': 'Avg Order Value',
            'Order ID': `${dailyCS}${avgOrderValue.toFixed(2)}`
          });
        }

        if (includeProductStats) {
          if (includeAvgSpending) {
            excelData.push({});
          }

          excelData.push({
            'Date': `=== DAILY PRODUCT STATS (${date}) ===`
          });

          const productStats = {};

          dayOrders.forEach(order => {
            if (order.cart && order.cart.length > 0) {
              order.cart.forEach(item => {
                const productName = getNameString(item.name);
                const qty = item.quantity || 1;
                const price = item.price || 0;

                if (!productStats[productName]) {
                  productStats[productName] = {
                    count: 0,
                    revenue: 0
                  };
                }

                productStats[productName].count += qty;
                productStats[productName].revenue += (price * qty);
              });
            }
          });

          excelData.push({
            'Date': 'Product Name',
            'Order ID': 'Quantity Sold',
            'User Name': 'Total Revenue'
          });

          // Sort by quantity desc
          Object.keys(productStats)
            .sort((a, b) => productStats[b].count - productStats[a].count)
            .forEach(name => {
              excelData.push({
                'Date': name,
                'Order ID': productStats[name].count,
                'User Name': `${dailyCS}${productStats[name].revenue.toFixed(2)}`
              });
            });
        }
      }
    });

    // Add Delivery Personnel Summary (only for delivery_personnel format)
    if (exportFormat === 'delivery_personnel') {
      const deliverySummary = {};

      const getCurrencySymbol = (curr) => {
        if (curr === 'ILS' || curr === 'NIS') return '₪';
        if (curr === 'USD') return '$';
        if (curr === 'EUR') return '€';
        if (curr === 'GBP') return '£';
        return curr || '$';
      };

      const summaryCS = filteredOrders.length > 0 ? getCurrencySymbol(filteredOrders[0].currency) : '₪';

      filteredOrders.forEach(order => {
        const deliveryUserId = order.deliveryUserId || order.deliveryUserID || order.deliveryUser || order.assignedDeliveryUser;
        const deliveryUser = deliveryUserId ? deliveryUsers[deliveryUserId] : null;
        const deliveryName = deliveryUser ? `${deliveryUser.firstName || ''} ${deliveryUser.lastName || ''}`.trim() : 'Unassigned';
        const deliveryEmail = deliveryUser?.email || 'N/A';
        const tipAmount = order.tipAmount || 0;

        if (!deliverySummary[deliveryUserId || 'unassigned']) {
          deliverySummary[deliveryUserId || 'unassigned'] = {
            name: deliveryName,
            email: deliveryEmail,
            orderCount: 0,
            totalTips: 0
          };
        }

        deliverySummary[deliveryUserId || 'unassigned'].orderCount++;
        deliverySummary[deliveryUserId || 'unassigned'].totalTips += tipAmount;
      });

      excelData.push({});
      excelData.push({});
      excelData.push({});

      excelData.push({
        'Date': '=== DELIVERY PERSONNEL SUMMARY ===',
        'Order ID': '',
        'Delivery Person Name': '',
        'Delivery Person Email': '',
        'Customer Name': '',
        'Seat Info': '',
        'Total Order Value': '',
        'Tip Amount': '',
        'Delivery Fee': '',
        'Product Names': ''
      });

      excelData.push({});

      Object.values(deliverySummary).forEach(summary => {
        excelData.push({
          'Date': '',
          'Order ID': '',
          'Delivery Person Name': summary.name,
          'Delivery Person Email': summary.email,
          'Customer Name': `${summary.orderCount} orders`,
          'Seat Info': '',
          'Total Order Value': '',
          'Tip Amount': `${summaryCS}${summary.totalTips.toFixed(2)}`,
          'Delivery Fee': '',
          'Product Names': ''
        });
      });

      const grandTotalOrders = Object.values(deliverySummary).reduce((sum, s) => sum + s.orderCount, 0);
      const grandTotalTips = Object.values(deliverySummary).reduce((sum, s) => sum + s.totalTips, 0);

      excelData.push({});
      excelData.push({
        'Date': '',
        'Order ID': '',
        'Delivery Person Name': 'GRAND TOTAL',
        'Delivery Person Email': '',
        'Customer Name': `${grandTotalOrders} orders`,
        'Seat Info': '',
        'Total Order Value': '',
        'Tip Amount': `${summaryCS}${grandTotalTips.toFixed(2)}`,
        'Delivery Fee': '',
        'Product Names': ''
      });
    }



    // --- ADDITIONAL STATISTICS (Moved back to Bottom) ---
    if (includeAvgSpending || includeProductStats) {
      const summaryCS = orders.length > 0 ? getCurrencySymbol(orders[0].currency) : '₪';

      // Add initial spacing
      excelData.push({});
      excelData.push({});

      if (includeAvgSpending) {
        excelData.push({
          'Date': '=== AVERAGE SPENDING STATS ==='
        });

        const userSpending = {};
        let totalRevenue = 0;
        let totalOrders = 0;

        filteredOrders.forEach(order => {
          const userId = order.userInfo?.userId || order.userInfo?.userEmail || order.userInfo?.userPhoneNo || `Unknown-${order.id}`;
          const userName = order.userInfo?.userName || 'Unknown User';

          if (!userSpending[userId]) {
            userSpending[userId] = {
              name: userName,
              spent: 0,
              orders: 0
            };
          }

          const orderTotal = order.total || 0;
          userSpending[userId].spent += orderTotal;
          userSpending[userId].orders += 1;
          totalRevenue += orderTotal;
          totalOrders += 1;
        });

        const uniqueUsersCount = Object.keys(userSpending).length;
        const avgSpendingPerUser = uniqueUsersCount > 0 ? totalRevenue / uniqueUsersCount : 0;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        excelData.push({
          'Date': 'Metric',
          'Order ID': 'Value'
        });

        excelData.push({
          'Date': 'Total Revenue',
          'Order ID': `${summaryCS}${totalRevenue.toFixed(2)}`
        });

        excelData.push({
          'Date': 'Total Orders',
          'Order ID': totalOrders
        });

        excelData.push({
          'Date': 'Unique Users',
          'Order ID': uniqueUsersCount
        });

        const repeatingUsersCount = Object.values(userSpending).filter(u => u.orders > 1).length;

        excelData.push({
          'Date': 'Repeating Users',
          'Order ID': repeatingUsersCount
        });

        excelData.push({
          'Date': 'Avg Spending/User',
          'Order ID': `${summaryCS}${avgSpendingPerUser.toFixed(2)}`
        });

        excelData.push({
          'Date': 'Avg Order Value',
          'Order ID': `${summaryCS}${avgOrderValue.toFixed(2)}`
        });
      }

      if (includeProductStats) {
        if (includeAvgSpending) {
          excelData.push({});
          excelData.push({});
        }

        excelData.push({
          'Date': '=== PRODUCT ORDER STATS ==='
        });

        const productStats = {};

        filteredOrders.forEach(order => {
          if (order.cart && order.cart.length > 0) {
            order.cart.forEach(item => {
              const productName = getNameString(item.name);
              const qty = item.quantity || 1;
              const price = item.price || 0;

              if (!productStats[productName]) {
                productStats[productName] = {
                  count: 0,
                  revenue: 0
                };
              }

              productStats[productName].count += qty;
              productStats[productName].revenue += (price * qty);
            });
          }
        });

        excelData.push({
          'Date': 'Product Name',
          'Order ID': 'Quantity Sold',
          'User Name': 'Total Revenue'
        });

        // Sort by quantity desc
        Object.keys(productStats)
          .sort((a, b) => productStats[b].count - productStats[a].count)
          .forEach(name => {
            excelData.push({
              'Date': name,
              'Order ID': productStats[name].count,
              'User Name': `${summaryCS}${productStats[name].revenue.toFixed(2)}`
            });
          });
      }
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Auto-adjust column widths (basic approximation)
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Orders Report');

    // Generate filename
    const today = new Date().toISOString().split('T')[0];
    const shopName = exportShopId !== 'all' ? (allShops.find(s => s.id === exportShopId)?.name || 'Shop') : 'All_Shops';
    const filename = `orders_${exportFormat}_${shopName}_${today}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
    setExportDialogOpen(false);
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
          {/* Shop Filter Dropdown - Only visible to ADMIN */}
          {userRole === 'admin' && (
            <FormControl sx={{ minWidth: { xs: '100%', sm: 250 }, width: { xs: '100%', sm: 'auto' } }}>
              <InputLabel>Filter by Shop</InputLabel>
              <Select
                value={selectedShopFilter}
                label="Filter by Shop"
                onChange={(e) => setSelectedShopFilter(e.target.value)}
              >
                <MenuItem value="stadium">All Shops (Selected Stadium)</MenuItem>
                {allShops.map((shop) => (
                  <MenuItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Date Range Quick Filters */}
          <Box sx={{ overflowX: 'auto', maxWidth: '100%', pb: 1 }}>
            <ButtonGroup variant="outlined" size={isMobile ? "small" : "medium"} sx={{ minWidth: 'fit-content' }}>
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
          </Box>

          {/* Current Date Range Display */}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Showing: {selectedDateRange.startDate.toLocaleDateString()} - {selectedDateRange.endDate.toLocaleDateString()}
          </Typography>
        </Box>

        {/* Centered Filter Buttons */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 0 },
          mb: 4,
          '& .MuiButtonGroup-root': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }
        }}>
          <Box sx={{ overflowX: 'auto', maxWidth: '100%', pb: 1 }}>
            <ButtonGroup variant="contained" size={isMobile ? "small" : "medium"} sx={{ minWidth: 'fit-content' }}>
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
          </Box>
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
          deliveryUsers={deliveryUsers}
          currentUser={currentUser}
          pickupPoints={pickupPoints}
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
        <Dialog open={exportDialogOpen} onClose={handleExportClose} maxWidth="sm" fullWidth>
          <DialogTitle>Export Orders</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

              {/* Report Format Selection (Only for Admin) */}
              {userRole === 'admin' && (
                <Box>
                  <FormLabel component="legend">Report Format</FormLabel>
                  <RadioGroup
                    row
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <FormControlLabel value="admin" control={<Radio />} label="Admin (Full)" />
                    <FormControlLabel value="vendor" control={<Radio />} label="Vendor" />
                    <FormControlLabel value="field_manager" control={<Radio />} label="Field Manager" />
                    <FormControlLabel value="delivery_personnel" control={<Radio />} label="Delivery Personnel" />
                  </RadioGroup>
                </Box>
              )}

              {/* Shop Selection (Only for Admin) */}
              {userRole === 'admin' && (
                <FormControl fullWidth>
                  <InputLabel>Filter by Shop</InputLabel>
                  <Select
                    value={exportShopId}
                    label="Filter by Shop"
                    onChange={(e) => setExportShopId(e.target.value)}
                  >
                    <MenuItem value="all">All Shops</MenuItem>
                    {allShops.map((shop) => (
                      <MenuItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Date Selection */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Dates to Export:</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                  {availableDates.map((date) => (
                    <FormControlLabel
                      key={date}
                      control={
                        <Checkbox
                          checked={selectedDates.includes(date)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDates(prev => [...prev, date]);
                            } else {
                              setSelectedDates(prev => prev.filter(d => d !== date));
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="500">
                            {date}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {orders.filter(order =>
                              order.createdAt &&
                              new Date(order.createdAt).toLocaleDateString() === date &&
                              (exportShopId === 'all' || order.shopId === exportShopId)
                            ).length} orders
                          </Typography>
                        </Box>
                      }
                      sx={{ ml: 0 }}
                    />
                  ))}
                  {availableDates.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No orders found in current view
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Additional Statistics */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Additional Statistics:</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeAvgSpending}
                        onChange={(e) => setIncludeAvgSpending(e.target.checked)}
                      />
                    }
                    label="Average Spending of Users"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeProductStats}
                        onChange={(e) => setIncludeProductStats(e.target.checked)}
                      />
                    }
                    label="Number of Orders per Product"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeDailyBreakdown}
                        onChange={(e) => setIncludeDailyBreakdown(e.target.checked)}
                        disabled={!includeAvgSpending && !includeProductStats}
                      />
                    }
                    label="Show Stats Breakdown per Day"
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleExportClose}>Cancel</Button>
            <Button
              onClick={exportToExcel}
              variant="contained"
              disabled={selectedDates.length === 0}
            >
              Export Report
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};


export default Orders;
