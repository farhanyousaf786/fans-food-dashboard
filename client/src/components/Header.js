import React, { useState, useEffect, useContext } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Box, Typography, Avatar, useTheme, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import PersonIcon from '@mui/icons-material/Person';
import LanguageSelector from './LanguageSelector';

const Header = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState('');
    const [userImage, setUserImage] = useState('');
    const isRTL = language === 'he';

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Get user data from role-based collections
                // Try admins collection first
                let userDoc = await getDoc(doc(db, 'admins', user.uid));
                
                // If not found in admins, check shopowners collection
                if (!userDoc.exists()) {
                    userDoc = await getDoc(doc(db, 'shopowners', user.uid));
                }
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Get user's name from Firestore
                    setUserName(userData.name || 'User');
                    // Use Firebase auth photo or set to empty for default avatar
                    setUserImage(user.photoURL || '');
                }
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                right: 0,
                left: 0, // Full width across screen
                height: { xs: '60px', sm: '70px' }, // Smaller height on mobile
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1200, // Higher than sidebar
                display: 'flex',
                alignItems: 'center',
                px: { xs: 2, sm: 3 }, // Less padding on mobile
                justifyContent: 'space-between'
            }}
        >
            <Typography 
                variant="h5" 
                sx={{ 
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                    fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' }, // Responsive font size
                    letterSpacing: { xs: '0.2px', sm: '0.5px' },
                    display: { xs: 'none', sm: 'block' } // Hide on mobile, show abbreviated
                }}
            >
                Fan Munch Dashboard
            </Typography>
            
            {/* Mobile title - abbreviated */}
            <Typography 
                variant="h6" 
                sx={{ 
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                    fontSize: '1rem',
                    letterSpacing: '0.2px',
                    display: { xs: 'block', sm: 'none' } // Show only on mobile
                }}
            >
                Fan Munch
            </Typography>
            
            <Box sx={{ 
                marginLeft: isRTL ? 0 : 'auto',
                marginRight: isRTL ? 'auto' : 0,
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, // Less gap on mobile
                flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
                <LanguageSelector />
                
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isRTL ? 'row-reverse' : 'row', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 } // Less gap on mobile
                }}>
                    <Avatar
                        src={userImage}
                        sx={{
                            width: { xs: 32, sm: 40 }, // Smaller on mobile
                            height: { xs: 32, sm: 40 },
                            bgcolor: userImage ? 'transparent' : theme.palette.primary.main,
                            transition: 'all 0.2s',
                            border: '2px solid transparent',
                            cursor: 'pointer',
                            order: isRTL ? 1 : 'unset',
                            '&:hover': {
                                border: `2px solid ${theme.palette.primary.main}`,
                                transform: 'scale(1.05)',
                            }
                        }}
                        onClick={() => navigate('/profile')}
                    >
                        {!userImage && <PersonIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                    </Avatar>
                    {userName && (
                        <Box sx={{ 
                            display: { xs: 'none', sm: 'flex' }, // Hide username on mobile
                            alignItems: 'center', 
                            gap: 1,
                            marginRight: isRTL ? 1 : 0,
                            marginLeft: isRTL ? 0 : 1
                        }}>
                            <Typography 
                                sx={{ 
                                    color: theme.palette.primary.main,
                                    fontWeight: 600,
                                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {userName}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default Header;
