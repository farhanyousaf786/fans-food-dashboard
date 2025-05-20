import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();


  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Orders', icon: <OrdersIcon />, path: '/orders' },
    { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#4C9E48', 
          borderRight: 'none'
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 8 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            py: 3,
            mt: 2
          }}
        >
          <Box
            sx={{
              width: '120px',
              height: '120px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px'
            }}
          >
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/fans-food-stf.firebasestorage.app/o/static-images%2Ffans_food_logo_green.png?alt=media&token=8091953e-fcc0-478a-af56-7db90a45d00e" 
              alt="Fans Food Logo"
              style={{ 
                width: '240px',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  color: 'white',
                  '&.Mui-selected': {
                    backgroundColor: '#fff',
                    color: '#4C9E48',
                    '&:hover': {
                      backgroundColor: '#fff',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? '#4C9E48' : 'white',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
