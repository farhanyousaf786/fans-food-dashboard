import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analysis = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('stadium');
  const [shopData, setShopData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopsLoaded, setShopsLoaded] = useState(false);

  // Animation state
  const [fadeIn, setFadeIn] = useState(false);
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' or 'orders'
  const [topItems, setTopItems] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  // Determine currency symbol from orders
  const currencySymbol = (() => {
    const orderWithCurrency = orders.find(o => o.currency);
    if (orderWithCurrency) {
      const c = orderWithCurrency.currency;
      if (['USD', 'usd', '$'].includes(c)) return '$';
      if (['EUR', 'eur', '€'].includes(c)) return '€';
      if (['GBP', 'gbp', '£'].includes(c)) return '£';
      if (['NIS', 'nis', 'ILS', 'ils', '₪'].includes(c)) return '₪';
    }
    return '$';
  })();

  useEffect(() => {
    // Get current shop data from localStorage (for stadium context)
    const savedShopData = localStorage.getItem('currentShopData');
    if (savedShopData) {
      setShopData(JSON.parse(savedShopData));
    }
    fetchShops();
  }, []);

  useEffect(() => {
    if (shopsLoaded) {
      fetchOrders();
    }
  }, [selectedShop, startDate, endDate, shopsLoaded]);

  const fetchShops = async () => {
    try {
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      const currentUserId = auth.currentUser?.uid || user?.id;

      const shopsRef = collection(db, 'shops');
      let shopsQuery;

      // If admin has stadium context, only fetch shops from that stadium
      if (user?.role === 'admin' && shopData?.stadiumId) {
        shopsQuery = query(shopsRef, where('stadiumId', '==', shopData.stadiumId));
      } else {
        shopsQuery = query(shopsRef); // Fetch all for other cases
      }

      const snapshot = await getDocs(shopsQuery);
      let shopsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter shops for shop owners
      if (user && user.role === 'shopowner') {
        shopsList = shopsList.filter(shop =>
          shop.admins && shop.admins.includes(currentUserId)
        );
      }

      setShops(shopsList);
      setShopsLoaded(true);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setShopsLoaded(true);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let ordersQuery = collection(db, 'orders');

      // Apply shop filter
      if (selectedShop === 'stadium' && shopData?.stadiumId) {
        // Filter by stadium for admin users
        ordersQuery = query(ordersQuery, where('stadiumId', '==', shopData.stadiumId));
      } else if (selectedShop !== 'stadium') {
        ordersQuery = query(ordersQuery, where('shopId', '==', selectedShop));
      }

      // Apply date range filter
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        ordersQuery = query(
          ordersQuery,
          where('createdAt', '>=', start),
          where('createdAt', '<=', end)
        );
      }

      const snapshot = await getDocs(ordersQuery);
      let ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Security: Filter orders to only include those from accessible shops
      // This is crucial when selectedShop is 'all'
      const accessibleShopIds = shops.map(s => s.id);
      ordersList = ordersList.filter(order => accessibleShopIds.includes(order.shopId));

      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  useEffect(() => {
    if (orders.length === 0) {
      setTopItems([]);
      setTopUsers([]);
      return;
    }

    // Top Items
    const itemMap = {};
    orders.forEach(order => {
      order.cart?.forEach(item => {
        const itemName = item.name?.en || item.name || 'Unknown';
        itemMap[itemName] = (itemMap[itemName] || 0) + (item.quantity || 1);
      });
    });
    const sortedItems = Object.entries(itemMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    setTopItems(sortedItems);

    // Top Users
    const userMap = {};
    orders.forEach(order => {
      if (order.userInfo?.userName) {
        const name = order.userInfo.userName;
        if (!userMap[name]) userMap[name] = { count: 0, total: 0 };
        userMap[name].count += 1;
        userMap[name].total += (order.total || 0);
      }
    });
    const sortedUsers = Object.entries(userMap)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));
    setTopUsers(sortedUsers);

  }, [orders]);

  // Prepare data for charts
  const prepareChartData = () => {
    // Group by date for time series
    const dailyData = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt?.seconds * 1000).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { date, revenue: 0, orders: 0 };
      }
      dailyData[date].revenue += order.total || 0;
      dailyData[date].orders += 1;
    });

    return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const chartData = prepareChartData();

  useEffect(() => {
    // Trigger fade in animation
    setFadeIn(true);
  }, []);

  return (
    <Container maxWidth="xl" sx={{
      opacity: fadeIn ? 1 : 0,
      transition: 'opacity 0.5s ease-in-out',
      py: 4
    }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: theme.palette.primary.main,
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          Sales Analytics
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* Filters */}
        <Paper
          elevation={2}
          sx={{
            p: isMobile ? 2 : 3,
            mb: 4,
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Select Shop</InputLabel>
                <Select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  label="Select Shop"
                >
                  <MenuItem value="stadium">All Shops (Selected Stadium)</MenuItem>
                  {shops.map((shop) => (
                    <MenuItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  minDate={startDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

          </Grid>
        </Paper>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(61, 112, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}
                  >
                    <Typography variant="h6" color="primary">{currencySymbol}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Revenue
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {currencySymbol}{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(76, 175, 80, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}
                  >
                    <Typography variant="h6" color="success">📦</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Orders
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {totalOrders.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(255, 152, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}
                  >
                    <Typography variant="h6" color="warning">📊</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Avg. Order Value
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {currencySymbol}{avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                p: isMobile ? 2 : 3,
                borderRadius: 2,
                background: theme.palette.background.paper,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  Revenue Over Time
                </Typography>
                <Box>
                  <ToggleButtonGroup
                    value={chartMetric}
                    exclusive
                    onChange={(e, newMetric) => { if (newMetric) setChartMetric(newMetric); }}
                    size="small"
                    aria-label="chart metric"
                  >
                    <ToggleButton value="revenue">Revenue</ToggleButton>
                    <ToggleButton value="orders">Orders</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>
              <div style={{ height: isMobile ? 300 : 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => chartMetric === 'revenue' ? `${currencySymbol}${value}` : value}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [chartMetric === 'revenue' ? `${currencySymbol}${value}` : value, chartMetric === 'revenue' ? 'Revenue' : 'Orders']}
                      contentStyle={{
                        borderRadius: 8,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: 'none'
                      }}
                    />
                    <Bar
                      dataKey={chartMetric}
                      name={chartMetric === 'revenue' ? 'Revenue' : 'Orders'}
                      fill="url(#colorRevenue)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid>
        </Grid>

        {/* Additional Metrics */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 2,
                background: theme.palette.background.paper,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                Top Selling Items
              </Typography>
              <List>
                {topItems.map((item, index) => (
                  <ListItem key={index} divider={index < topItems.length - 1} sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', fontWeight: 'bold' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.name}
                      secondary={`${item.count} sold`}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                    <Chip label="Top Seller" size="small" color="primary" variant="outlined" />
                  </ListItem>
                ))}
                {topItems.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}><Typography color="textSecondary">No sales data yet</Typography></Box>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Analysis;
