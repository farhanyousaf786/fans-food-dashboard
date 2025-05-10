import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStadium } from '../../context/StadiumContext';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Typography from '@mui/material/Typography';

// Dashboard Components
import StatCard from './components/StatCard';
import OrdersSummary from './components/OrdersSummary';
import RevenueChart from './components/RevenueChart';

const Dashboard = () => {
  const { selectedStadium } = useStadium();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [venueData, setVenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVenueData = useCallback(async () => {
    try {
      if (user?.uid && selectedStadium?.id) {
        // Get admin data
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const adminData = docSnap.data();

          // Get stadium-specific data
          const ordersQuery = query(
            collection(db, 'orders'),
            where('stadiumId', '==', selectedStadium.id)
          );

          const ordersSnap = await getDocs(ordersQuery);
          const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // Calculate stadium-specific stats
          const activeOrders = orders.filter(order => order.status === 'active').length;
          const completedOrders = orders.filter(order => order.status === 'completed').length;
          const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
          const totalOrders = orders.length;

          // Calculate total revenue from completed orders
          const totalRevenue = orders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

          // Get unique customer count
          const uniqueCustomers = new Set(orders.map(order => order.customerId)).size;

          setVenueData({
            venues: [adminData],
            totalRevenue,
            totalOrders,
            totalCustomers: uniqueCustomers,
            activeOrders,
            completedOrders,
            cancelledOrders
          });
        }
      }
    } catch (error) {
      console.error('Error fetching venue data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedStadium]);

  useEffect(() => {
    if (!selectedStadium) {
      navigate('/stadiums');
      return;
    }

    if (user?.uid && selectedStadium?.id) {
      fetchVenueData();
    }
  }, [selectedStadium, user, navigate, fetchVenueData]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <Typography variant="h4" gutterBottom>
            {selectedStadium ? `${selectedStadium.name} Dashboard` : 'Dashboard'}
          </Typography>
        </div>

        <div className="stats-grid">
          <StatCard 
            title="Total Menus" 
            value={venueData?.venues[0]?.menus?.length || 0}
            icon={<span className="material-icons">restaurant_menu</span>}
          />
          <StatCard 
            title="Total Revenue" 
            value={`$${venueData?.totalRevenue || '0'}`}
            icon={<span className="material-icons">payments</span>}
          />
          <StatCard 
            title="Total Orders" 
            value={venueData?.totalOrders || 0}
            icon={<span className="material-icons">receipt_long</span>}
          />
          <StatCard 
            title="Total Customers" 
            value={venueData?.totalCustomers || 0}
            icon={<span className="material-icons">groups</span>}
          />
        </div>

        <div className="dashboard-grid">
          <OrdersSummary 
            activeOrders={venueData?.activeOrders}
            completedOrders={venueData?.completedOrders}
            cancelledOrders={venueData?.cancelledOrders}
          />
          <RevenueChart />
        </div>

        <div className="action-buttons">
          <button className="action-button" onClick={() => console.log('Add shop')}>
            Add New Shop
          </button>
          <button className="action-button" onClick={() => console.log('View orders')}>
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
