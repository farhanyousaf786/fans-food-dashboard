import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import HomeIcon from '@mui/icons-material/Home';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupsIcon from '@mui/icons-material/Groups';
import StadiumIcon from '@mui/icons-material/Stadium';
import { Badge } from '@mui/material';

const Sidebar = () => {
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

        <NavLink to="/menus" className="nav-item" activeClassName="active">
          <RestaurantMenuIcon /> Menus
        </NavLink>

        <div className="nav-group">
          <div className="nav-header">Customers</div>
          <NavLink to="/customers/add" className="nav-item sub-item">
            <PersonAddIcon /> Add New
          </NavLink>
          <NavLink to="/customers/members" className="nav-item sub-item">
            <GroupsIcon /> Members
          </NavLink>
          <NavLink to="/customers/general" className="nav-item sub-item">
            <PeopleIcon /> General Customers
          </NavLink>
        </div>

        <NavLink to="/analytics" className="nav-item" activeClassName="active">
          <BarChartIcon /> Analytics
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <div className="add-menu-card">
          <img src="/assets/images/menu-icon.png" alt="Menu" className="menu-icon" />
          <h3>Organize your menus</h3>
          <p>Add and manage your menu items here</p>
          <button className="add-menu-btn">+ Add Menus</button>
        </div>

        <div className="footer-text">
          <p>FansFood Admin Dashboard</p>
          <small>© 2024 All Rights Reserved</small>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
