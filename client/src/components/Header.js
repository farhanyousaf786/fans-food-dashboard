import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import PersonIcon from '@mui/icons-material/Person';

const Header = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState('');
    const [userImage, setUserImage] = useState('');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Get user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Get user's name from Firestore
                    setUserName(userData.name || 'User');
                    setUserName(userData.name || '');
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
                left: 240, // Width of sidebar
                height: '70px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                px: 3,
                justifyContent: 'space-between'
            }}
        >
            
            <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                src={userImage}
                sx={{
                    width: 40,
                    height: 40,
                    bgcolor: userImage ? 'transparent' : theme.palette.primary.main,
                    transition: 'all 0.2s',
                    border: '2px solid transparent'
                }}
            >
                {!userImage && <PersonIcon />}
            </Avatar>
                {userName && (

                    <>
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
                        <Box 
                            onClick={() => navigate('/profile')}
                            sx={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': {
                                    '& .MuiAvatar-root': {
                                        border: `2px solid ${theme.palette.primary.main}`,
                                        transform: 'scale(1.05)',
                                    }
                                }
                            }}
                        >
                            
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default Header;
