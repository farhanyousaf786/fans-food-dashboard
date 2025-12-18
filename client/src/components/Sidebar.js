import React, { useState, useEffect, useContext } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
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
  Logout as LogoutIcon,
  BarChart as AnalysisIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { Category as CategoryIcon } from '@mui/icons-material';
import { LocalShipping as DeliveryIcon } from '@mui/icons-material';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db, getFCMToken } from '../config/firebase';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import User from '../models/User';
import logo from '../assets/logo.png';

const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const isRTL = language === 'he';
  const [userStadiumId, setUserStadiumId] = useState(null);
  
  // Get current user role from localStorage
  const getCurrentUserRole = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      return userData?.role || null;
    } catch {
      return null;
    }
  };
  
  const userRole = getCurrentUserRole();

  // Fetch user's first stadium for dynamic linking
  useEffect(() => {
    const fetchUserStadium = async () => {
      try {
        const stadiumsCollection = collection(db, 'stadiums');
        const stadiumsSnapshot = await getDocs(stadiumsCollection);
        const stadiums = stadiumsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (stadiums.length > 0) {
          // For now, just use the first stadium. You can modify this logic based on user permissions
          setUserStadiumId(stadiums[0].id);
        }
      } catch (error) {
        console.error('Error fetching stadiums:', error);
      }
    };

    fetchUserStadium();
  }, []);

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
      console.log('🔄 LOGOUT: Navigating to home page');
      // Navigate to root first
      navigate('/');
      // Then force a full page reload to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Base menu items for all users
  const baseMenuItems = [
    { text: t('sidebar.dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { text: t('sidebar.orders'), icon: <OrdersIcon />, path: '/orders' },
    { text: t('sidebar.analysis'), icon: <AnalysisIcon />, path: '/analysis' },
    { text: t('sidebar.profile'), icon: <PersonIcon />, path: '/profile' },
    { text: t('sidebar.addCategory'), icon: <CategoryIcon />, path: '/add-category' },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    { 
      text: 'Shops and Delivery', 
      icon: <DeliveryIcon />, 
      path: userStadiumId ? `/stadium/${userStadiumId}` : '/dashboard',
      disabled: !userStadiumId
    },
    { text: 'User Management', icon: <PeopleIcon />, path: '/user-management' },
  ];

  // Combine menu items based on user role
  const menuItems = userRole === 'admin' 
    ? [...baseMenuItems, ...adminMenuItems]
    : baseMenuItems;

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
          border: 'none',
          top: '70px',
          height: 'calc(100vh - 70px)',
          right: isRTL ? 0 : 'auto',
          left: isRTL ? 'auto' : 0,
          transition: 'right 0.3s, left 0.3s'
        },
      }}
      anchor={isRTL ? 'right' : 'left'}
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
                disabled={item.disabled}
                sx={{
                  color: item.disabled ? 'rgba(255,255,255,0.5)' : 'white',
                  '&.Mui-selected': {
                    backgroundColor: '#fff',
                    color: '#3D70FF',
                    '&:hover': {
                      backgroundColor: '#fff',
                    },
                  },
                  '&:hover': {
                    backgroundColor: item.disabled ? 'transparent' : 'rgba(255,255,255,0.1)',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? '#3D70FF' : (item.disabled ? 'rgba(255,255,255,0.5)' : 'white'),
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
