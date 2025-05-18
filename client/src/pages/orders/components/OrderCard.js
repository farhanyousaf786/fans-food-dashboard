import React from 'react';
import {
  Card, CardContent, Typography, Box, Chip, IconButton, Button,
  Paper
} from '@mui/material';
import {
  MoreVert, Payment, ShoppingCart, LocationOn, AccessTime
} from '@mui/icons-material';
import Order from '../../../models/Order';

const OrderCard = ({ order, onViewDetails, onMenuClick, restaurantName, getStatusColor }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return (
    <Card 
      elevation={3} 
      className="order-card"
      component={Paper}
    >
      <CardContent className="order-content">
        <Box className="order-header">
          <Box>
            <Typography variant="h6" className="order-customer">
              {order.customerName || 'Customer'}
            </Typography>
            <Typography variant="caption" className="order-id">
              #{order.id.slice(0, 6)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={(e) => onMenuClick(e, order)}>
            <MoreVert />
          </IconButton>
        </Box>

        <Box className="status-row">
          <Chip 
            label={Order.getStatusText(order.status)} 
            color={getStatusColor(order.status)} 
            size="small"
          />
          <Chip 
            icon={<Payment fontSize="small" />} 
            label={Order.getPaymentMethodText(order.paymentMethod)} 
            size="small" 
          />
        </Box>

        <Typography variant="body2" className="order-info">
          <ShoppingCart fontSize="small" /> {order.cart?.length || 0} items
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <AccessTime fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            {formatDate(order.createdAt)}
          </Typography>
        </Box>
        <Typography variant="subtitle1" className="order-total" sx={{ fontSize: '1.25rem' }}>
          ${order.total}
        </Typography>
        
        <Typography variant="body2" className="order-location">
          <LocationOn fontSize="small" /> {restaurantName || 'Restaurant'}
        </Typography>

        <Button
          size="small"
          fullWidth
          variant="outlined"
          className="view-details-btn"
          onClick={() => onViewDetails(order)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
