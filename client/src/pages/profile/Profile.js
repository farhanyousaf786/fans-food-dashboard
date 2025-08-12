import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import UserProfileCard from './components/UserProfileCard';
import ShopAdminManager from './components/ShopAdminManager';
import './Profile.css';

const Profile = () => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        setUserData(user);
        console.log('👤 PROFILE: Current user data:', user);
    };

    return (
        <div className="profile-container">
            <Typography variant="h4" className="profile-title">
                Profile
            </Typography>
            
            <UserProfileCard userData={userData} />
            <ShopAdminManager />
        </div>
    );
};

export default Profile;
