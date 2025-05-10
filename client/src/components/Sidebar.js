import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import './Sidebar.css';
import HomeIcon from '@mui/icons-material/Home';

import ReceiptIcon from '@mui/icons-material/Receipt';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupsIcon from '@mui/icons-material/Groups';
import StadiumIcon from '@mui/icons-material/Stadium';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Badge } from '@mui/material';

const Sidebar = () => {
  const location = useLocation();
  const { selectedShop } = useShop();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="https://i.imgur.com/a7sYFli.png" alt="FansFood" />
          <span>FansFood</span>
        </div>
      </div>
      <div className="sidebar-content">
        <NavLink to="/stadiums" className="nav-item" activeClassName="active">
          <StadiumIcon /> Stadiums
        </NavLink>

        <NavLink to="/dashboard" className="nav-item" activeClassName="active">
          <HomeIcon /> Dashboard
        </NavLink>

        <NavLink to="/orders" className="nav-item" activeClassName="active">
          <Badge badgeContent={25} color="error">
            <ReceiptIcon />
          </Badge>
          Orders
        </NavLink>

        <NavLink to="/shops" className="nav-item" activeClassName="active">
          <StorefrontIcon /> Shops
        </NavLink>


   

        <NavLink to="/analytics" className="nav-item" activeClassName="active">
          <BarChartIcon /> Analytics
        </NavLink>
      </div>

      <div className="sidebar-footer">


        <div className="footer-text">
          <p>FansFood Admin Dashboard</p>
          <small>© 2024 All Rights Reserved</small>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
