import React from 'react';
import './Dashboard.css';

const RevenueChart = () => {
  return (
    <div className="dashboard-card revenue-chart">
      <div className="card-header">
        <h2>Revenue</h2>
        <select className="time-select">
          <option>Monthly</option>
          <option>Weekly</option>
          <option>Daily</option>
        </select>
      </div>
      <div className="chart-placeholder">
        <div className="placeholder-text">Revenue Chart Coming Soon</div>
      </div>
    </div>
  );
};

export default RevenueChart;
