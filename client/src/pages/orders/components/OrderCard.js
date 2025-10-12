import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, CardContent, Typography, Box, Chip, IconButton, Button,
  Paper, useTheme, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import {
  MoreVert, Payment, ShoppingCart, LocationOn, AccessTime
} from '@mui/icons-material';
import Order from '../../../models/Order';
import { styled } from '@mui/material/styles';

// Styled component for RTL support
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  border: '1px solid',
  borderColor: theme.palette.divider,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  }
}));

const OrderCard = ({ order, onViewDetails, onMenuClick, restaurantName, getStatusColor, shopName }) => {
  const [openDialog, setOpenDialog] = React.useState(false);
  const theme = useTheme();
  const { t } = useTranslation();
  const isRTL = theme.direction === 'rtl';
  
  const formatDate = (date) => {
    return new Date(date).toLocaleString(isRTL ? 'he-IL' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <StyledCard elevation={1} className="order-card" component={Paper}>
      <CardContent className="order-content" sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box className="order-header" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" className="order-customer" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '1.1rem' }}>
              {order.userInfo?.userName || t('common.customer')}
            </Typography>
            <Typography variant="caption" className="order-id" color="text.secondary" dir="ltr" sx={{ display: 'block' }}>
              {t('orders.orderNumber', { number: order.orderId.slice(0, 6) })}
            </Typography>
            {shopName && (
              <Typography variant="caption" sx={{ display: 'block', color: 'success.main', fontWeight: 600, mt: 0.5 }}>
                🏪 {shopName}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={(e) => onMenuClick(e, order)}>
            <MoreVert />
          </IconButton>
        </Box>

        <Box className="status-row" sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip 
            label={t(`orderStatus.${order.status}`)} 
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
            {t('common.seatInformation')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'inherit' }}>
            {t('common.section')} {order.seatInfo?.section || '-'}, 
            {t('common.row')} {order.seatInfo?.row || '-'}, 
            {t('common.seat')} {order.seatInfo?.seatNo || '-'}
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
                {isRTL 
                  ? [...order.seatInfo.seatDetails.split(' ')].reverse().slice(0, 5).reverse().join(' ')
                  : order.seatInfo.seatDetails.split(' ').slice(0, 5).join(' ')
                }
                {order.seatInfo.seatDetails.split(' ').length > 5 && '...'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Order Items */}
        <Box sx={{ mb: 2, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 600 }} gutterBottom>
            {t('common.orderItems')}
          </Typography>
          {order.cart?.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{item.name}</Typography>
              <Typography variant="body2" color="text.secondary">×{item.quantity}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {t('common.totalAmount')}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              ₪{order.total}
            </Typography>
          </Box>
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
          {t('common.viewDetails')}
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
    </StyledCard>
  );
};

export default OrderCard;
