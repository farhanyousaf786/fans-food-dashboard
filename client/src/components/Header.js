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
                height: '70px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1200, // Higher than sidebar
                display: 'flex',
                alignItems: 'center',
                px: 3,
                justifyContent: 'space-between'
            }}
        >
            <Typography 
                variant="h5" 
                sx={{ 
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                    fontSize: '1.5rem',
                    letterSpacing: '0.5px'
                }}
            >
                Fan Munch Dashboard
            </Typography>
            
            <Box sx={{ 
                marginLeft: isRTL ? 0 : 'auto',
                marginRight: isRTL ? 'auto' : 0,
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
                <LanguageSelector />
                
                <Box sx={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 1 }}>
                    <Avatar
                        src={userImage}
                        sx={{
                            width: 40,
                            height: 40,
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
                        {!userImage && <PersonIcon />}
                    </Avatar>
                    {userName && (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            marginRight: isRTL ? 1 : 0,
                            marginLeft: isRTL ? 0 : 1
                        }}>
                            <Typography 
                                sx={{ 
                                    color: theme.palette.primary.main,
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
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
