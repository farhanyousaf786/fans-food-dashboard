import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
  useTheme,
  Button
} from '@mui/material';
import { 
  Close, 
  LocationOn, 
  AccessTime, 
  ShoppingCart, 
  Payment,
  Person
} from '@mui/icons-material';
import Order from '../../../models/Order';

const OrderDetails = ({ order, open, onClose, restaurantName }) => {
  const theme = useTheme();
  if (!order) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: theme.palette.primary.main,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart />
          <Typography variant="h6" component="span">
            Order Details
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Status and Time */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3,
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2
        }}>
          <Chip 
            label={Order.getStatusText(order.status)}
            color="primary"
            sx={{ fontWeight: 600 }}
          />
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <AccessTime fontSize="small" />
            {formatDate(order.createdAt)}
          </Typography>
        </Box>

        {/* Customer Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ 
            color: theme.palette.primary.main,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}>
            <Person /> Customer Information
          </Typography>
          <Box sx={{ 
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography><strong>Name:</strong> {order.userInfo?.userName || 'N/A'}</Typography>
            <Typography><strong>Order ID:</strong> #{order.orderId.slice(0, 6)}</Typography>
            {order.seatInfo && (
              <Typography sx={{ mt: 1 }}>
                <strong>Seat:</strong> Section {order.seatInfo.section}, 
                Row {order.seatInfo.row}, 
                Seat {order.seatInfo.seatNo}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Order Items */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ 
            color: theme.palette.primary.main,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}>
            <ShoppingCart /> Order Items
          </Typography>
          <Box sx={{ 
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            {order.cart?.map((item, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mb: 1,
                pb: 1,
                borderBottom: index !== order.cart.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider'
              }}>
                <Typography>{item.name}</Typography>
                <Typography sx={{ color: 'text.secondary' }}>×{item.quantity}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Payment Details */}
        <Box>
          <Typography variant="subtitle1" sx={{ 
            color: theme.palette.primary.main,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}>
            <Payment /> Payment Details
          </Typography>
          <Box sx={{ 
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Subtotal:</Typography>
              <Typography>${order.subtotal}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Delivery Fee:</Typography>
              <Typography>${order.deliveryFee}</Typography>
            </Box>
            {order.discount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Discount:</Typography>
                <Typography color="error.main">-${order.discount}</Typography>
              </Box>
            )}
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total:</Typography>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 600,
                color: theme.palette.primary.main
              }}>
                ${order.total}
              </Typography>
            </Box>
            <Chip 
              icon={<Payment fontSize="small" />}
              label={Order.getPaymentMethodText(order.paymentMethod)}
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: '1px solid rgba(0, 0, 0, 0.08)', 
        padding: 2, 
        justifyContent: 'flex-end'
      }}>
        <Button variant="contained" onClick={onClose} sx={{ minWidth: 100 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetails;
