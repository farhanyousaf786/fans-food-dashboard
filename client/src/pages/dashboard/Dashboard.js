import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Dashboard Components
import StatCard from './components/StatCard';
import OrdersSummary from './components/OrdersSummary';
import RevenueChart from './components/RevenueChart';

const Dashboard = () => {
  const { user } = useAuth();
  const [venueData, setVenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        if (user?.uid) {
          const docRef = doc(db, 'admins', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setVenueData(docSnap.data());
          }
        }
      } catch (error) {
        console.error('Error fetching venue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueData();
  }, [user]);

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
          <h1>Welcome, {venueData?.venueName || 'NYC'}</h1>
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
