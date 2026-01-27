import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, CardContent, Typography, Box, Chip, IconButton, Button,
  Paper, useTheme, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import {
  MoreVert, Payment, ShoppingCart, LocationOn, AccessTime, Phone
} from '@mui/icons-material';
import Order from '../../../models/Order';
import { styled } from '@mui/material/styles';

// Styled component for RTL support
const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
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
    if (!date) return t('common.unknownDate');
    try {
      return new Date(date).toLocaleString(isRTL ? 'he-IL' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      return t('common.unknownDate');
    }
  };

  const getName = (val, defaultVal = 'Unknown') => {
    if (!val) return defaultVal;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val.en || val.he || val.name || val.description || defaultVal;
    }
    return String(val);
  };

  const getLocationParts = () => {
    const parts = [];
    if (order.insideDelivery?.location) {
      parts.push(getName(order.insideDelivery.location));
    }
    const { section, row, seatNo, room, floor, area, stand, entrance } = order.seatInfo || {};
    if (room) parts.push(`Room: ${getName(room)}`);
    if (floor) parts.push(`Floor: ${getName(floor)}`);
    if (stand) parts.push(`Stand: ${getName(stand)}`);
    if (area) parts.push(`Area: ${getName(area)}`);
    if (section) parts.push(`${t('common.section')} ${getName(section)}`);
    if (row) parts.push(`${t('common.row')} ${getName(row)}`);
    if (seatNo) parts.push(`${t('common.seat')} ${getName(seatNo)}`);
    if (entrance) parts.push(`Entrance: ${getName(entrance)}`);

    if (order.outsideDelivery?.location) {
      parts.push(`Outside: ${getName(order.outsideDelivery.location)}`);
    }

    return parts;
  };

  return (
    <StyledCard elevation={1} className="order-card" component={Paper}>
      <CardContent className="order-content" sx={{ p: { xs: 1.5, sm: 3 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box className="order-header" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" className="order-customer" sx={{ color: 'primary.main', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }} noWrap>
              {getName(order.userInfo?.userName, t('common.customer'))}
            </Typography>
            {order.userInfo?.userPhoneNo && (
              <Box component="a" href={`tel:${order.userInfo.userPhoneNo}`} sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'text.secondary', mb: 0.5 }}>
                <Phone sx={{ fontSize: 14, mr: 0.5 }} />
                <Typography variant="caption">{order.userInfo.userPhoneNo}</Typography>
              </Box>
            )}
            <Typography variant="caption" className="order-id" color="text.secondary" dir="ltr" sx={{ display: 'block' }}>
              {t('orders.orderNumber', { number: getName(order.orderCode || order.id) })}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600 }}>
              {order.deliveryMethod === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
            </Typography>
            {order.deliveryType && order.deliveryMethod === 'delivery' && (
              <Chip
                label={getName(order.deliveryType === 'inside' ? 'Inside' : 'Outside')}
                size="small"
                sx={{ bgcolor: 'white', fontWeight: 600 }}
              />
            )}
          </Box>

          {order.deliveryMethod !== 'pickup' && (
            <Box sx={{ mt: 0.5 }}>
              {getLocationParts().map((part, i) => (
                <Typography key={i} variant="body2" sx={{ color: 'inherit', fontWeight: 500, display: 'block' }}>
                  {part}
                </Typography>
              ))}
              {getLocationParts().length === 0 && (
                <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 500 }}>-</Typography>
              )}
            </Box>
          )}

          {(order.seatInfo?.seatDetails || order.insideDelivery?.notes) && (
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
                📝 {(() => {
                  const combinedNotes = [
                    getName(order.seatInfo?.seatDetails, ''),
                    getName(order.insideDelivery?.notes, '')
                  ].filter(Boolean).join(' | ');

                  const words = combinedNotes.split(' ');
                  if (words.length <= 5) return combinedNotes;
                  return isRTL
                    ? [...words].reverse().slice(0, 5).reverse().join(' ') + '...'
                    : words.slice(0, 5).join(' ') + '...';
                })()}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Order Items */}
        <Box sx={{
          mb: 2,
          flex: 1,
          maxHeight: 220,
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 2 }
        }}>
          <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 600 }} gutterBottom>
            {t('common.orderItems')}
          </Typography>
          {order.cart?.map((item, index) => (
            <Box key={index} sx={{ mb: 1.5, pb: 1, borderBottom: '1px dashed #eee', '&:last-child': { borderBottom: 'none' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight="500" noWrap sx={{ maxWidth: { xs: 150, sm: 200 } }}>{getName(item.name)}</Typography>
                <Typography variant="body2" color="text.secondary">×{item.quantity}</Typography>
              </Box>

              {/* Options */}
              {item.selectedOptions && item.selectedOptions.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1, mt: 0.5 }}>
                  + {item.selectedOptions.map(opt => getName(opt)).join(', ')}
                </Typography>
              )}

              {/* Combo breakdown */}
              {item.isCombo && item.comboSelectedOption && (
                <Box sx={{ ml: 1, mt: 0.5, pl: 1, borderLeft: '2px solid #eee' }}>
                  {item.comboSelectedOption.map((subItem, subIndex) => (
                    <Box key={subIndex} sx={{ mb: 0.5 }}>
                      <Typography variant="caption" display="block" sx={{ fontWeight: 500 }}>
                        • {getName(subItem.itemName)}
                      </Typography>
                      {subItem.options && subItem.options.length > 0 && (subItem.options[0] !== 'Default' || subItem.options.length > 1) && (
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 1.5 }}>
                          {subItem.options.map(opt => getName(opt)).join(', ')}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {t('common.totalAmount')}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {(() => {
                const curr = order.currency;
                if (curr === 'ILS' || curr === 'NIS') return '₪';
                if (curr === 'USD') return '$';
                if (curr === 'EUR') return '€';
                if (curr === 'GBP') return '£';
                return curr || '$';
              })()}{order.total}
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
            {getName(order.seatInfo?.seatDetails, '')}
            {order.seatInfo?.seatDetails && order.insideDelivery?.notes && <br />}
            {getName(order.insideDelivery?.notes, '')}
          </Typography>
        </DialogContent>
      </Dialog>
    </StyledCard>
  );
};

export default OrderCard;
