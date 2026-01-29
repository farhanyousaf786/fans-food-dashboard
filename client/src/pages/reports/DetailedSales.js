import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Container,
    Paper,
    Grid,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { GetApp, Assessment } from '@mui/icons-material';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Order from '../../models/Order';

const DetailedSales = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'he';

    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [allShops, setAllShops] = useState([]);
    const [userRole, setUserRole] = useState('');

    const [selectedShopId, setSelectedShopId] = useState('all');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setHours(0, 0, 0, 0)),
        endDate: new Date(new Date().setHours(23, 59, 59, 999))
    });

    const getNameString = (val) => {
        if (!val) return 'N/A';
        if (typeof val === 'string') return val;
        return val[i18n.language] || val['en'] || val['he'] || Object.values(val)[0] || 'N/A';
    };

    // 1. Initial Setup
    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (userString) {
            const user = JSON.parse(userString);
            setUserRole(user.role);
        }

        const fetchShops = async () => {
            try {
                const savedShopData = localStorage.getItem('currentShopData');
                let shopsQuery = collection(db, 'shops');

                if (savedShopData) {
                    const shopData = JSON.parse(savedShopData);
                    if (shopData?.stadiumId) {
                        shopsQuery = query(collection(db, 'shops'), where('stadiumId', '==', shopData.stadiumId));
                    }
                }

                const shopsSnap = await getDocs(shopsQuery);
                setAllShops(shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching shops:", err);
            }
        };
        fetchShops();
    }, []);

    // 2. Fetch Orders
    useEffect(() => {
        setLoading(true);
        const ordersRef = collection(db, 'orders');
        let q = query(ordersRef);

        if (selectedShopId !== 'all') {
            q = query(ordersRef, where('shopId', '==', selectedShopId));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersList = snapshot.docs.map(doc => Order.fromFirestore({ ...doc.data(), id: doc.id }));

            const filtered = ordersList.filter(order => {
                if (!order.createdAt) return false;
                const d = new Date(order.createdAt);
                return d >= dateRange.startDate && d <= dateRange.endDate;
            });

            setOrders(filtered);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedShopId, dateRange]);

    // 3. Process Item Sales Data
    const processItemSales = () => {
        const itemStats = {};
        const dateStats = {};

        orders.forEach(order => {
            const shop = allShops.find(s => s.id === order.shopId);
            if (!shop) return; // Skip unassigned orders

            const orderDate = new Date(order.createdAt).toLocaleDateString();

            if (!dateStats[orderDate]) {
                dateStats[orderDate] = {};
            }

            (order.cart || []).forEach(item => {
                const itemName = getNameString(item.nameMap) || item.name || 'Unknown Item';
                const itemPrice = Number(item.price || 0);
                const itemQty = Number(item.quantity || 1);
                const itemTotal = itemPrice * itemQty;

                // Overall item stats
                if (!itemStats[itemName]) {
                    itemStats[itemName] = {
                        totalQty: 0,
                        totalRevenue: 0,
                        dailyBreakdown: {}
                    };
                }
                itemStats[itemName].totalQty += itemQty;
                itemStats[itemName].totalRevenue += itemTotal;

                // Daily breakdown for this item
                if (!itemStats[itemName].dailyBreakdown[orderDate]) {
                    itemStats[itemName].dailyBreakdown[orderDate] = { qty: 0, revenue: 0 };
                }
                itemStats[itemName].dailyBreakdown[orderDate].qty += itemQty;
                itemStats[itemName].dailyBreakdown[orderDate].revenue += itemTotal;
            });
        });

        return { itemStats, dates: Object.keys(dateStats).sort() };
    };

    const { itemStats, dates } = processItemSales();
    const sortedItems = Object.entries(itemStats).sort((a, b) => b[1].totalRevenue - a[1].totalRevenue);

    const exportPDF = () => {
        const doc = new jsPDF('landscape');

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Detailed Item Sales Report", 148, 15, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Period: ${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`, 148, 20, { align: "center" });

        const tableData = [];
        sortedItems.forEach(([itemName, data]) => {
            const dailyData = dates.map(date => {
                const dayData = data.dailyBreakdown[date];
                return dayData ? `${dayData.qty} ($${dayData.revenue.toFixed(2)})` : '-';
            });

            tableData.push([
                itemName,
                ...dailyData,
                data.totalQty,
                `$${data.totalRevenue.toFixed(2)}`
            ]);
        });

        autoTable(doc, {
            startY: 25,
            head: [['Item Name', ...dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })), 'Total Qty', 'Total Revenue']],
            body: tableData,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [61, 112, 255], fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 40 }
            }
        });

        doc.save(`Detailed_Sales_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e' }}>
                    Detailed Item Sales Report
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<GetApp />}
                    onClick={exportPDF}
                    disabled={orders.length === 0}
                    sx={{ borderRadius: 2, px: 3 }}
                >
                    Export PDF
                </Button>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Grid container spacing={3} alignItems="center">
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid item xs={12} sm={4}>
                            <DatePicker
                                label="Start Date"
                                value={dateRange.startDate}
                                onChange={(val) => setDateRange(prev => ({ ...prev, startDate: val }))}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <DatePicker
                                label="End Date"
                                value={dateRange.endDate}
                                onChange={(val) => setDateRange(prev => ({ ...prev, endDate: val }))}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                    </LocalizationProvider>
                    {userRole === 'admin' && (
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Filter by Shop</InputLabel>
                                <Select
                                    value={selectedShopId}
                                    label="Filter by Shop"
                                    onChange={(e) => setSelectedShopId(e.target.value)}
                                >
                                    <MenuItem value="all">All Shops</MenuItem>
                                    {allShops.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
            ) : orders.length === 0 ? (
                <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 2 }}>
                    <Assessment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No sales data found for this period
                    </Typography>
                </Paper>
            ) : (
                <Paper sx={{ p: 4, borderRadius: 2, overflow: 'auto' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                        Item Sales Breakdown
                    </Typography>
                    <Table size="small" sx={{ minWidth: 800 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Item Name</TableCell>
                                {dates.map(date => (
                                    <TableCell key={date} align="center" sx={{ fontWeight: 'bold', minWidth: 100 }}>
                                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </TableCell>
                                ))}
                                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#e3f2fd', minWidth: 80 }}>Total Qty</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#e3f2fd', minWidth: 100 }}>Total Revenue</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedItems.map(([itemName, data]) => (
                                <TableRow key={itemName} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{itemName}</TableCell>
                                    {dates.map(date => {
                                        const dayData = data.dailyBreakdown[date];
                                        return (
                                            <TableCell key={date} align="center">
                                                {dayData ? (
                                                    <Box>
                                                        <Chip
                                                            label={dayData.qty}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ mb: 0.5 }}
                                                        />
                                                        <Typography variant="caption" display="block" color="text.secondary">
                                                            ${dayData.revenue.toFixed(2)}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">-</Typography>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>
                                        {data.totalQty}
                                    </TableCell>
                                    <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', color: '#1a237e' }}>
                                        ${data.totalRevenue.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            )}
        </Container>
    );
};

export default DetailedSales;
