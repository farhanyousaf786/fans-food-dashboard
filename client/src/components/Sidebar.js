import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Button
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Stadium as StadiumIcon,
  ShoppingCart as OrdersIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { Category as CategoryIcon } from '@mui/icons-material';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db, getFCMToken } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import User from '../models/User';
import logo from '../assets/logo.png';

const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log('🚪 LOGOUT: Starting logout process...');
      
      // Get current user and device info
      const currentUser = auth.currentUser;
      const deviceId = localStorage.getItem('deviceId');
      console.log('🆔 LOGOUT: Current user ID:', currentUser?.uid);
      console.log('🆔 LOGOUT: Device ID:', deviceId);
      
      if (currentUser && deviceId) {
        // Remove FCM token for this device - check both collections
        console.log('🔍 LOGOUT: Fetching user document from Firestore...');
        
        // Try to find user in admins collection first
        let userDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        let collection = 'admins';
        
        // If not found in admins, check shopowners collection
        if (!userDoc.exists()) {
          userDoc = await getDoc(doc(db, 'shopowners', currentUser.uid));
          collection = 'shopowners';
        }
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const user = User.fromFirestore(userData, currentUser.uid);
          console.log('🔍 LOGOUT: Current FCM tokens before removal:', user.fcmTokens);
          
          // Remove FCM token for current device
          console.log('🗑️ LOGOUT: Removing FCM token for device:', deviceId);
          user.removeFCMToken(deviceId);
          console.log('🗑️ LOGOUT: FCM tokens after removal:', user.fcmTokens);
          
          // Update user document in correct collection
          await updateDoc(doc(db, collection, currentUser.uid), {
            fcmTokens: user.fcmTokens,
            updatedAt: user.updatedAt
          });
          console.log(`✅ LOGOUT: FCM token removed from ${collection} collection`);
        } else {
          console.log('⚠️ LOGOUT: User document not found in any collection');
        }
      } else {
        console.log('⚠️ LOGOUT: No current user or device ID found');
      }
      
      await signOut(auth);
      localStorage.removeItem('user');
      console.log('✅ LOGOUT: Firebase sign out completed');
      console.log('🔄 LOGOUT: Navigating to auth page (no reload to preserve console logs)');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Orders', icon: <OrdersIcon />, path: '/orders' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Add Category', icon: <CategoryIcon />, path: '/add-category' },
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
          backgroundColor: '#3D70FF', 
          borderRight: 'none',
          top: '70px', // Start below header
          height: 'calc(100vh - 70px)' // Adjust height
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
          <Box sx={{ pt: 1.5, pb: 3, px: 3, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{
              width: '100px',
              height: '100px',
              backgroundColor: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}>
              <img 
                src={logo} 
                alt="FansFood Logo" 
                style={{ 
                  width: '70px', 
                  height: '70px', 
                  objectFit: 'contain'
                }} 
              />
            </Box>
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
                    color: '#3D70FF',
                    '&:hover': {
                      backgroundColor: '#fff',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? '#3D70FF' : 'white',
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
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
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
