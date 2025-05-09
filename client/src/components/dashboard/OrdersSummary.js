import React, { useState } from 'react';
import './Dashboard.css';

const OrdersSummary = ({ activeOrders, completedOrders, cancelledOrders }) => {
  const [timeFilter, setTimeFilter] = useState('monthly');

  return (
    <div className="dashboard-card orders-summary">
      <div className="card-header">
        <h2>Orders Summary</h2>
        <div className="time-filter">
          <button 
            className={timeFilter === 'monthly' ? 'active' : ''} 
            onClick={() => setTimeFilter('monthly')}
          >
            Monthly
          </button>
          <button 
            className={timeFilter === 'weekly' ? 'active' : ''} 
            onClick={() => setTimeFilter('weekly')}
          >
            Weekly
          </button>
          <button 
            className={timeFilter === 'today' ? 'active' : ''} 
            onClick={() => setTimeFilter('today')}
          >
            Today
          </button>
        </div>
      </div>
      <div className="order-stats">
        <div className="order-stat">
          <span>On Delivery</span>
          <strong>{activeOrders || 0}</strong>
        </div>
        <div className="order-stat">
          <span>Delivered</span>
          <strong>{completedOrders || 0}</strong>
        </div>
        <div className="order-stat">
          <span>Cancelled</span>
          <strong>{cancelledOrders || 0}</strong>
        </div>
      </div>
    </div>
  );
};

export default OrdersSummary;
