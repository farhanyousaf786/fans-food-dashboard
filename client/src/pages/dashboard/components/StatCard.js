import React from 'react';
import '../Dashboard.css';

const StatCard = ({ title, value, icon }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <h3>{title}</h3>
      <p className="stat-number">{value}</p>
    </div>
  </div>
);

export default StatCard;
