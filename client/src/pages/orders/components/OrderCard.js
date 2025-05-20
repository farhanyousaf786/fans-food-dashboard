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
              {order.userInfo?.userName || 'Customer'}
            </Typography>
            <Typography variant="caption" className="order-id">
              #{order.orderId.slice(0, 6)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={(e) => onMenuClick(e, order)}>
            <MoreVert />
          </IconButton>
        </Box>

        <Box className="status-row" sx={{ mb: 2 }}>
          <Chip 
            label={Order.getStatusText(order.status)} 
            color={getStatusColor(order.status)} 
            size="small"
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {formatDate(order.createdAt)}
            </Typography>
          </Box>
        </Box>

        {/* Seat Info */}
        <Box sx={{ mb: 2, bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Seat Information
          </Typography>
          <Typography variant="body2">
            Section {order.seatInfo?.section || '-'}, 
            Row {order.seatInfo?.row || '-'}, 
            Seat {order.seatInfo?.seatNo || '-'}
          </Typography>
          {order.seatInfo?.seatDetails && (
            <Typography variant="caption" color="text.secondary" display="block">
              {order.seatInfo.seatDetails}
            </Typography>
          )}
        </Box>

        {/* Order Items */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Order Items
          </Typography>
          {order.cart?.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{item.name}</Typography>
              <Typography variant="body2" color="text.secondary">×{item.quantity}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Amount
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              ${order.total}
            </Typography>
          </Box>
          <Chip 
            icon={<Payment fontSize="small" />} 
            label={Order.getPaymentMethodText(order.paymentMethod)} 
            size="small" 
            variant="outlined"
          />
        </Box>

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
