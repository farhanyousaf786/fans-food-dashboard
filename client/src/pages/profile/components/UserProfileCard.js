import React from 'react';
import { Card, Typography, Chip } from '@mui/material';
import { Person, Email, Badge } from '@mui/icons-material';

const UserProfileCard = ({ userData }) => {
  if (!userData) return null;

  return (
    <Card className="profile-card">
      <div className="profile-info-row">
        <Person className="profile-icon" />
        <Typography variant="h6" className="profile-name">
          {userData.name}
        </Typography>
      </div>
      <div className="profile-info-row">
        <Email className="profile-icon" />
        <Typography className="profile-email">
          {userData.email}
        </Typography>
      </div>
      <div className="profile-info-row">
        <Badge className="profile-icon" />
        <Chip 
          label={userData.role} 
          className="profile-role-chip" 
          variant="outlined" 
        />
      </div>
    </Card>
  );
};

export default UserProfileCard;
