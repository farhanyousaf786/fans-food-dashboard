import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';
import { Avatar, Menu, MenuItem, Badge, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';



const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
        </div>

        <div className="header-center">
          <div className="search-bar">
            <SearchIcon className="search-icon" />
            <input type="text" placeholder="Search here" />
          </div>
        </div>
        
        <div className="header-right">
          <div className="profile-section">
            <div className="profile-info" onClick={handleMenu}>
              <Avatar
                src={user?.photoURL}
                className="avatar-button"
                sx={{ 
                  width: 40,
                  height: 40,
                  cursor: 'pointer'
                }}
              />
              <div className="profile-text">
                <span className="profile-name">{user?.displayName || 'Admin'}</span>
                <span className="profile-role">Admin</span>
              </div>
            </div>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleProfile}>
                <SettingsIcon sx={{ mr: 1 }} /> Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1, transform: 'rotate(180deg)' }} /> Logout
              </MenuItem>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
