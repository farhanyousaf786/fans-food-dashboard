import React from 'react';
import {
  Card, CardContent, Typography, Box, Chip, IconButton, Button,
  Paper, useTheme, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import {
  MoreVert, Payment, ShoppingCart, LocationOn, AccessTime
} from '@mui/icons-material';
import Order from '../../../models/Order';

const OrderCard = ({ order, onViewDetails, onMenuClick, restaurantName, getStatusColor }) => {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = React.useState(false);
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
      elevation={1}
      className="order-card"
      component={Paper}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent className="order-content" sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box className="order-header" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" className="order-customer" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '1.1rem' }}>
              {order.userInfo?.userName || 'Customer'}
            </Typography>
            <Typography variant="caption" className="order-id" color="text.secondary">
              #{order.orderId.slice(0, 6)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={(e) => onMenuClick(e, order)}>
            <MoreVert />
          </IconButton>
        </Box>

        <Box className="status-row" sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        <Box sx={{ mb: 2, bgcolor: 'success.light', p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600 }} gutterBottom>
            Seat Information
          </Typography>
          <Typography variant="body2" sx={{ color: 'inherit' }}>
            Section {order.seatInfo?.section || '-'}, 
            Row {order.seatInfo?.row || '-'}, 
            Seat {order.seatInfo?.seatNo || '-'}
          </Typography>
          {order.seatInfo?.seatDetails && (
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              mt: 1.5
            }}>
              <Typography 
                variant="caption" 
                onClick={() => setOpenDialog(true)}
                sx={{ 
                  color: theme.palette.primary.main,
                  bgcolor: '#fff',
                  py: 0.5,
                  px: 2,
                  borderRadius: '20px',
                  fontWeight: 600,
                  display: 'inline-block',
                  maxWidth: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }
                }}
              >
                {order.seatInfo.seatDetails.split(' ').slice(0, 5).join(' ')}
                {order.seatInfo.seatDetails.split(' ').length > 5 && '...'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Order Items */}
        <Box sx={{ mb: 2, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 600 }} gutterBottom>
            Order Items
          </Typography>
          {order.cart?.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{item.name}</Typography>
              <Typography variant="body2" color="text.secondary">×{item.quantity}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 'auto', pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
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
          variant="contained"
          sx={{ 
            mt: 2,
            py: 1,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark'
            },
            textTransform: 'none',
            fontWeight: 500
          }}
          className="view-details-btn"
          onClick={() => onViewDetails(order)}
        >
          View Details
        </Button>
      </CardContent>

      {/* Seat Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: '90%',
            width: 'auto'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: 'white',
          fontSize: '1rem',
          py: 1.5
        }}>
          Seat Details
        </DialogTitle>
        <DialogContent sx={{ p: 3, minWidth: 300 }}>
          <Typography sx={{ 
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'text.primary'
          }}>
            {order.seatInfo.seatDetails}
          </Typography>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OrderCard;
