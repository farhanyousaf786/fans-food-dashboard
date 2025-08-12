import React from 'react';
import {
  Card,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { auth } from '../../../config/firebase';

const ShopAdminCard = ({ 
  shop, 
  onAddAdmin, 
  onRemoveAdmin, 
  getOwnerName 
}) => {
  return (
    <Card className="shop-card">
      <div className="shop-header">
        <Typography variant="h6" className="shop-name">
          {shop.name}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<Add />}
          className="add-admin-btn"
          onClick={() => onAddAdmin(shop)}
        >
          Add Admin
        </Button>
      </div>
      
      <Typography className="shop-location">
        📍 {shop.stadiumName} - {shop.location}
      </Typography>
      
      <Typography variant="subtitle1" className="admins-title">
        Current Admins:
      </Typography>
      
      <List dense className="admin-list">
        {shop.admins && shop.admins.map((adminId) => (
          <ListItem key={adminId} className="admin-item">
            <ListItemText 
              primary={<span className="admin-name">{getOwnerName(adminId)}</span>}
              secondary={
                adminId === auth.currentUser.uid ? 
                <span className="admin-you-label">(You)</span> : ''
              }
            />
            {adminId !== auth.currentUser.uid && (
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  onClick={() => onRemoveAdmin(shop.id, adminId)}
                  className="remove-admin-btn"
                >
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            )}
          </ListItem>
        ))}
      </List>
    </Card>
  );
};

export default ShopAdminCard;
