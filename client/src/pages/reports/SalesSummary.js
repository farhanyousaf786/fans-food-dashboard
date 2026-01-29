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
    Divider,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHead,
    useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { GetApp, FilterList, Summarize, Email } from '@mui/icons-material';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Order from '../../models/Order';

const SalesSummary = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'he';
    const theme = useTheme();

    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState({});
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

    // 1. Initial Setup: Auth & Shops
    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (userString) {
            const user = JSON.parse(userString);
            setUserRole(user.role);

            if (user.role === 'shopowner') {
                const savedShopData = localStorage.getItem('currentShopData');
                if (savedShopData) {
                    const shop = JSON.parse(savedShopData);
                    setSelectedShopId(shop.id);
                }
            }
        }

        const fetchShopsAndCats = async () => {
            try {
                // Get current shop data to filter by stadium
                const savedShopData = localStorage.getItem('currentShopData');
                let shopsQuery = collection(db, 'shops');

                if (savedShopData) {
                    const shopData = JSON.parse(savedShopData);
                    if (shopData?.stadiumId) {
                        // Filter shops by stadium
                        shopsQuery = query(collection(db, 'shops'), where('stadiumId', '==', shopData.stadiumId));
                    }
                }

                const shopsSnap = await getDocs(shopsQuery);
                setAllShops(shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const catsSnap = await getDocs(collection(db, 'categories'));
                const catMap = {};
                catsSnap.docs.forEach(doc => {
                    catMap[doc.id] = { id: doc.id, ...doc.data() };
                });
                setCategories(catMap);
            } catch (err) {
                console.error("Error fetching setup data:", err);
            }
        };
        fetchShopsAndCats();
    }, []);

    // 2. Fetch Orders based on Filters
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

    // 3. Process Data for UI and PDF
    const processReportData = () => {
        const shopStats = {};
        const dailyBreakdown = {}; // Organize by date
        let totals = {
            gross: 0,
            discount: 0,
            net: 0,
            tips: 0,
            delivery: 0,
            grand: 0
        };

        orders.forEach(order => {
            const shopId = order.shopId || "unknown";
            const shop = allShops.find(s => s.id === shopId);

            // Skip orders that don't belong to any shop in this stadium
            if (!shop) {
                return;
            }

            const shopName = shop.name;
            const orderDate = new Date(order.createdAt).toLocaleDateString();

            // Initialize daily breakdown for this date
            if (!dailyBreakdown[orderDate]) {
                dailyBreakdown[orderDate] = {
                    shops: {},
                    total: 0,
                    tips: 0,
                    delivery: 0,
                    grandTotal: 0
                };
            }

            if (!shopStats[shopId]) {
                shopStats[shopId] = {
                    name: shopName,
                    gross: 0,
                    discount: 0,
                    net: 0,
                    items: {}
                };
            }

            const subtotal = Number(order.subtotal || 0);
            const discount = Number(order.discount || 0);
            const tip = Number(order.tipAmount || 0);
            const delivery = Number(order.deliveryFee || 0);

            shopStats[shopId].gross += subtotal;
            shopStats[shopId].discount += discount;
            shopStats[shopId].net += (subtotal - discount);

            totals.gross += subtotal;
            totals.discount += discount;
            totals.net += (subtotal - discount);
            totals.tips += tip;
            totals.delivery += delivery;
            totals.grand += (subtotal - discount); // Grand total = Net revenue (no tips/delivery)

            // Add to daily totals
            dailyBreakdown[orderDate].tips += tip;
            dailyBreakdown[orderDate].delivery += delivery;
            dailyBreakdown[orderDate].grandTotal += subtotal; // Daily total = Gross for that day

            (order.cart || []).forEach(item => {
                const itemName = getNameString(item.nameMap) || item.name || 'Unknown Item';
                const itemPrice = Number(item.price || 0);
                const itemQty = Number(item.quantity || 1);
                const itemTotal = itemPrice * itemQty;

                // Track items per shop for overall totals
                if (!shopStats[shopId].items[itemName]) {
                    shopStats[shopId].items[itemName] = { count: 0, amount: 0 };
                }
                shopStats[shopId].items[itemName].count += itemQty;
                shopStats[shopId].items[itemName].amount += itemTotal;

                // Track items per shop per day
                if (!dailyBreakdown[orderDate].shops[shopName]) {
                    dailyBreakdown[orderDate].shops[shopName] = {
                        items: {},
                        total: 0
                    };
                }
                if (!dailyBreakdown[orderDate].shops[shopName].items[itemName]) {
                    dailyBreakdown[orderDate].shops[shopName].items[itemName] = { count: 0, amount: 0 };
                }
                dailyBreakdown[orderDate].shops[shopName].items[itemName].count += itemQty;
                dailyBreakdown[orderDate].shops[shopName].items[itemName].amount += itemTotal;
                dailyBreakdown[orderDate].shops[shopName].total += itemTotal;
                dailyBreakdown[orderDate].total += itemTotal;
            });
        });

        // Sort dates
        const sortedDates = Object.keys(dailyBreakdown).sort((a, b) => new Date(a) - new Date(b));

        return { shopStats, totals, dailyBreakdown, sortedDates };
    };

    const { shopStats, totals, dailyBreakdown, sortedDates } = processReportData();
    const cs = "$"; // Always use USD symbol

    const exportPDF = () => {
        const doc = new jsPDF();
        const formatDateTime = (date) => date.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

        doc.setFontSize(16); doc.setFont("helvetica", "bold");
        doc.text("Sales Summary with Revenue Detail", 105, 15, { align: "center" });
        doc.setFontSize(9); doc.setFont("helvetica", "normal");
        doc.text(`Processed Business Period Starting ${formatDateTime(dateRange.startDate)} and Ending ${formatDateTime(dateRange.endDate)}`, 105, 20, { align: "center" });
        doc.text(`Grouped by: Profit Center | ${selectedShopId === 'all' ? 'All Shops' : allShops.find(s => s.id === selectedShopId)?.name}`, 105, 24, { align: "center" });

        const tableRows = [];

        // Daily Breakdown
        tableRows.push([{ content: 'GROSS REVENUE - DAILY BREAKDOWN', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }]);
        sortedDates.forEach(date => {
            const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            tableRows.push([{ content: formattedDate, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [227, 242, 253] } }]);

            Object.entries(dailyBreakdown[date].shops).forEach(([shopName, shopData]) => {
                tableRows.push([{ content: `  ${shopName}`, styles: { fontStyle: 'bold' } }, { content: `${cs}${shopData.total.toFixed(2)}`, styles: { fontStyle: 'bold' } }]);
                Object.entries(shopData.items).sort((a, b) => b[1].amount - a[1].amount).forEach(([itemName, itemData]) => {
                    tableRows.push([`    ${itemName} (${itemData.count})`, `${cs}${itemData.amount.toFixed(2)}`]);
                });
            });

            // Day total
            tableRows.push([{ content: 'Day Total', styles: { fontStyle: 'bold' } }, { content: `${cs}${dailyBreakdown[date].total.toFixed(2)}`, styles: { fontStyle: 'bold' } }]);
            tableRows.push(['', '']);
        });
        tableRows.push(['', '']);

        // Overall Totals
        tableRows.push([{ content: 'OVERALL TOTALS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }]);
        Object.values(shopStats).forEach(shop => {
            tableRows.push([{ content: shop.name, styles: { fontStyle: 'bold' } }, '']);
            Object.entries(shop.items).sort((a, b) => b[1].amount - a[1].amount).forEach(([itemName, data]) => {
                tableRows.push([`    ${itemName} (${data.count})`, `${cs}${data.amount.toFixed(2)}`]);
            });
            tableRows.push([{ content: '    Subtotal', styles: { fontStyle: 'bold' } }, { content: `${cs}${shop.gross.toFixed(2)}`, styles: { fontStyle: 'bold' } }]);
        });
        tableRows.push([{ content: 'Total GROSS REVENUE', styles: { fontStyle: 'bold' } }, `${cs}${totals.gross.toFixed(2)}`]);
        tableRows.push(['', '']);

        tableRows.push([{ content: 'DISCOUNTS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }]);
        Object.values(shopStats).forEach(shop => shop.discount > 0 && tableRows.push([`    ${shop.name}`, `-${cs}${shop.discount.toFixed(2)}`]));
        tableRows.push([{ content: 'Total DISCOUNTS', styles: { fontStyle: 'bold' } }, `-${cs}${totals.discount.toFixed(2)}`]);
        tableRows.push(['', '']);

        tableRows.push([{ content: 'NET REVENUE', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }]);
        tableRows.push([{ content: 'Total NET REVENUE', styles: { fontStyle: 'bold' } }, `${cs}${totals.net.toFixed(2)}`]);
        tableRows.push(['', '']);

        tableRows.push([{ content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fontSize: 12 } }, `${cs}${totals.grand.toFixed(2)}`]);

        autoTable(doc, {
            startY: 30,
            body: tableRows,
            theme: 'plain',
            styles: { fontSize: 9 },
            columnStyles: { 1: { halign: 'right' } },
            margin: { left: 15, right: 15 }
        });

        doc.save(`Sales_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const emailToAdmin = () => {
        const doc = new jsPDF();
        const formatDateTime = (date) => date.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

        doc.setFontSize(16); doc.setFont("helvetica", "bold");
        doc.text("Sales Summary with Revenue Detail", 105, 15, { align: "center" });
        doc.setFontSize(9); doc.setFont("helvetica", "normal");
        doc.text(`Processed Business Period Starting ${formatDateTime(dateRange.startDate)} and Ending ${formatDateTime(dateRange.endDate)}`, 105, 20, { align: "center" });
        doc.text(`Grouped by: Profit Center | ${selectedShopId === 'all' ? 'All Shops' : allShops.find(s => s.id === selectedShopId)?.name}`, 105, 24, { align: "center" });

        const tableRows = [];

        // Daily Breakdown
        tableRows.push([{ content: 'GROSS REVENUE - DAILY BREAKDOWN', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }]);
        sortedDates.forEach(date => {
            const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            tableRows.push([{ content: formattedDate, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [227, 242, 253] } }]);

            Object.entries(dailyBreakdown[date].shops).forEach(([shopName, shopData]) => {
                tableRows.push([{ content: `  ${shopName}`, styles: { fontStyle: 'bold' } }, { content: `${cs}${shopData.total.toFixed(2)}`, styles: { fontStyle: 'bold' } }]);
                Object.entries(shopData.items).sort((a, b) => b[1].amount - a[1].amount).forEach(([itemName, itemData]) => {
                    tableRows.push([`    ${itemName} (${itemData.count})`, `${cs}${itemData.amount.toFixed(2)}`]);
                });
            });

            // Day total
            tableRows.push([{ content: 'Day Total', styles: { fontStyle: 'bold' } }, { content: `${cs}${dailyBreakdown[date].total.toFixed(2)}`, styles: { fontStyle: 'bold' } }]);
            tableRows.push(['', '']);
        });
        tableRows.push(['', '']);

        // Overall Totals
        tableRows.push([{ content: 'OVERALL TOTALS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }]);
        Object.values(shopStats).forEach(shop => {
            tableRows.push([{ content: shop.name, styles: { fontStyle: 'bold' } }, '']);
            Object.entries(shop.items).sort((a, b) => b[1].amount - a[1].amount).forEach(([itemName, data]) => {
                tableRows.push([`    ${itemName} (${data.count})`, `${cs}${data.amount.toFixed(2)}`]);
            });
            tableRows.push([{ content: '    Subtotal', styles: { fontStyle: 'bold' } }, { content: `${cs}${shop.gross.toFixed(2)}`, styles: { fontStyle: 'bold' } }]);
        });
        tableRows.push([{ content: 'Total GROSS REVENUE', styles: { fontStyle: 'bold' } }, `${cs}${totals.gross.toFixed(2)}`]);
        tableRows.push(['', '']);

        tableRows.push([{ content: 'DISCOUNTS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }]);
        Object.values(shopStats).forEach(shop => shop.discount > 0 && tableRows.push([`    ${shop.name}`, `-${cs}${shop.discount.toFixed(2)}`]));
        tableRows.push([{ content: 'Total DISCOUNTS', styles: { fontStyle: 'bold' } }, `-${cs}${totals.discount.toFixed(2)}`]);
        tableRows.push(['', '']);

        tableRows.push([{ content: 'NET REVENUE', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }]);
        tableRows.push([{ content: 'Total NET REVENUE', styles: { fontStyle: 'bold' } }, `${cs}${totals.net.toFixed(2)}`]);
        tableRows.push(['', '']);

        tableRows.push([{ content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fontSize: 12 } }, `${cs}${totals.grand.toFixed(2)}`]);

        autoTable(doc, {
            startY: 30,
            body: tableRows,
            theme: 'plain',
            styles: { fontSize: 9 },
            columnStyles: { 1: { halign: 'right' } },
            margin: { left: 15, right: 15 }
        });

        const fileName = `Sales_Summary_${new Date().toISOString().split('T')[0]}.pdf`;

        // Create mailto link
        const subject = encodeURIComponent(`Sales Summary Report - ${new Date().toLocaleDateString()}`);
        const body = encodeURIComponent(`Please find attached the Sales Summary Report for the period ${formatDateTime(dateRange.startDate)} to ${formatDateTime(dateRange.endDate)}.\n\nTotal Revenue: ${cs}${totals.grand.toFixed(2)}\n\nBest regards`);

        // Open email client
        window.location.href = `mailto:admin@fanmunch.com?subject=${subject}&body=${body}`;

        // Also download the PDF for the user to manually attach if needed
        doc.save(fileName);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e' }}>
                    Sales Summary Report
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Email />}
                        onClick={emailToAdmin}
                        disabled={orders.length === 0}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Email to Admin
                    </Button>
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
                    <Summarize sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No transactions found for this period
                    </Typography>
                </Paper>
            ) : (
                <>
                    <Paper sx={{ p: 4, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 600 }}>
                            Revenue Breakdown Details
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                            <Table size="small">
                                <TableBody>
                                    {/* GROSS REVENUE - DAILY BREAKDOWN */}
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>GROSS REVENUE - DAILY BREAKDOWN</TableCell>
                                        <TableCell align="right"></TableCell>
                                    </TableRow>

                                    {sortedDates.map(date => (
                                        <React.Fragment key={date}>
                                            <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                                                <TableCell sx={{ pl: 2, fontWeight: 'bold', fontSize: '1.05rem' }}>
                                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                    {cs}{dailyBreakdown[date].total.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                            {Object.entries(dailyBreakdown[date].shops).map(([shopName, shopData]) => (
                                                <React.Fragment key={shopName}>
                                                    <TableRow>
                                                        <TableCell sx={{ pl: 4, fontWeight: 'bold', color: '#555' }}>{shopName}</TableCell>
                                                        <TableCell align="right" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                                            {cs}{shopData.total.toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                    {Object.entries(shopData.items).sort((a, b) => b[1].amount - a[1].amount).map(([itemName, itemData]) => (
                                                        <TableRow key={itemName}>
                                                            <TableCell sx={{ pl: 8 }}>{itemName} ({itemData.count})</TableCell>
                                                            <TableCell align="right">{cs}{itemData.amount.toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                            <TableRow sx={{ height: 10 }}><TableCell colSpan={2} border={0} /></TableRow>
                                        </React.Fragment>
                                    ))}

                                    {/* OVERALL TOTALS */}
                                    <TableRow sx={{ height: 20 }}><TableCell colSpan={2} border={0} /></TableRow>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>OVERALL TOTALS</TableCell>
                                        <TableCell align="right"></TableCell>
                                    </TableRow>
                                    {Object.values(shopStats).map(shop => (
                                        <React.Fragment key={shop.name}>
                                            <TableRow>
                                                <TableCell sx={{ pl: 4, fontWeight: 'bold', color: '#555' }}>{shop.name}</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                            {Object.entries(shop.items).sort((a, b) => b[1].amount - a[1].amount).map(([itemName, data]) => (
                                                <TableRow key={itemName}>
                                                    <TableCell sx={{ pl: 8 }}>{itemName} ({data.count})</TableCell>
                                                    <TableCell align="right">{cs}{data.amount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell sx={{ pl: 8, fontStyle: 'italic', color: 'text.secondary' }}>Subtotal</TableCell>
                                                <TableCell align="right" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>{cs}{shop.gross.toFixed(2)}</TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Total Gross Revenue</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{cs}{totals.gross.toFixed(2)}</TableCell>
                                    </TableRow>

                                    {/* DISCOUNTS */}
                                    <TableRow sx={{ height: 20 }}><TableCell colSpan={2} border={0} /></TableRow>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>DISCOUNTS</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                    {Object.values(shopStats).map(shop => shop.discount > 0 && (
                                        <TableRow key={shop.name}>
                                            <TableCell sx={{ pl: 4 }}>{shop.name}</TableCell>
                                            <TableCell align="right">-{cs}{shop.discount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Total Discounts</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>-{cs}{totals.discount.toFixed(2)}</TableCell>
                                    </TableRow>

                                    {/* NET */}
                                    <TableRow sx={{ height: 20 }}><TableCell colSpan={2} border={0} /></TableRow>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>NET REVENUE</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Total Net Revenue</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{cs}{totals.net.toFixed(2)}</TableCell>
                                    </TableRow>

                                    {/* TAXES */}
                                    <TableRow sx={{ height: 20 }}><TableCell colSpan={2} border={0} /></TableRow>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>TAXES</TableCell>
                                        <TableCell align="right"></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ pl: 4 }}>NO TAX (0)</TableCell>
                                        <TableCell align="right">{cs}0.00</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Total Taxes</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{cs}0.00</TableCell>
                                    </TableRow>

                                    {/* GRAND TOTAL */}
                                    <TableRow sx={{ height: 40 }}><TableCell colSpan={2} border={0} /></TableRow>
                                    <TableRow sx={{ bgcolor: '#e8eaf6' }}>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 2 }}>GRAND TOTAL</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1a237e', py: 2 }}>
                                            {cs}{totals.grand.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>
                    </Paper>
                </>
            )}
        </Container>
    );
};

export default SalesSummary;
