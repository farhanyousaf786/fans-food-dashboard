import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Avatar, Stack, Divider, Button
} from '@mui/material';
import { Person, LocationOn } from '@mui/icons-material';

const OrderDetails = ({ order, open, onClose, restaurantName }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  if (!order) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        elevation: 8,
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'rgba(25, 118, 210, 0.02)',
        '& .MuiTypography-root': {
          fontWeight: 600,
          color: '#1976d2'
        }
      }}>
        Order Details
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" gutterBottom>Items:</Typography>
        {order.cart?.map((item, i) => (
          <Box key={i} className="item-details">
            <Avatar src={item.images?.[0]} variant="rounded" className="item-image" />
            <Box>
              <Typography>{item.name}</Typography>
              <Typography variant="caption">${item.price} × {item.quantity || 1}</Typography>
            </Box>
          </Box>
        ))}

        <Divider className="divider" />
        <Typography variant="subtitle2" gutterBottom>Price Breakdown</Typography>
        <Stack className="price-details">
          <Box className="price-row">
            <Typography>Subtotal</Typography>
            <Typography>${order.subtotal}</Typography>
          </Box>
          <Box className="price-row">
            <Typography>Delivery Fee</Typography>
            <Typography>${order.deliveryFee}</Typography>
          </Box>
          {order.discount > 0 && (
            <Box className="price-row">
              <Typography color="success.main">Discount</Typography>
              <Typography color="success.main">-${order.discount}</Typography>
            </Box>
          )}
          <Divider className="divider" />
          <Box className="price-row">
            <Typography fontWeight="bold">Total</Typography>
            <Typography color="primary" fontWeight="bold">${order.total}</Typography>
          </Box>
        </Stack>

        <Divider className="divider" />
        <Typography variant="subtitle2">Delivery Info</Typography>
        <Box className="delivery-info">
          <Typography><Person fontSize="small" /> {order.customerName || 'Customer'}</Typography>
          <Typography><LocationOn fontSize="small" /> {restaurantName}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" className="created-time">
          Created: {formatDate(order.createdAt)}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)', padding: 2 }}>
        <Button variant="contained" onClick={onClose} sx={{ minWidth: 100 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetails;
