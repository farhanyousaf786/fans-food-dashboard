import React from 'react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Person as PersonIcon,
    Stadium as StadiumIcon,
    Logout as LogoutIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Stadium', icon: <StadiumIcon />, path: '/stadium' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
];

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

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: '240px',
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    backgroundColor: '#15BE77',
                    color: 'white',
                    width: '240px',
                    boxSizing: 'border-box',
                    border: 'none'
                },
            }}
        >
            <Box sx={{ overflow: 'auto' }}>
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
                <List sx={{ mt: 2, px: 2 }}>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                selected={location.pathname === item.path}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius: '8px',
                                    '&.Mui-selected': {
                                        backgroundColor: '#fff',
                                        '&:hover': {
                                            backgroundColor: '#fff',
                                        },
                                    },
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: location.pathname === item.path ? '#15BE77' : '#fff' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text}
                                    sx={{ 
                                        color: location.pathname === item.path ? '#15BE77' : '#fff',
                                        backgroundColor: location.pathname === item.path ? '#fff' : 'transparent',
                                        fontWeight: location.pathname === item.path ? '600' : '400',
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Box sx={{ position: 'fixed', bottom: 0, width: drawerWidth }}>
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton 
                                onClick={handleLogout}
                                sx={{
                                    margin: '16px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.5)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid #fff',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: '#fff' }}>
                                    <LogoutIcon />
                                </ListItemIcon>
                                <ListItemText 
                                    primary="Logout" 
                                    sx={{ 
                                        color: '#fff',
                                        '& .MuiTypography-root': {
                                            fontWeight: 500
                                        }
                                    }} 
                                />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
