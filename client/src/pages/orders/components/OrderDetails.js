
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert
} from '@mui/material';
import {
  Close,
  AccessTime,
  ShoppingCart,
  Payment,
  Person,
  LocalShipping,
  AssignmentTurnedIn
} from '@mui/icons-material';
import Order from '../../../models/Order';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useState } from 'react';

const OrderDetails = ({ order, open, onClose, restaurantName, deliveryUsers, currentUser, pickupPoints = {} }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  // Assignment state
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = React.useState('');
  const [assigning, setAssigning] = React.useState(false);
  const [assignmentMessage, setAssignmentMessage] = React.useState('');

  if (!order) return null;

  const getName = (val, defaultVal = 'N/A') => {
    if (!val) return defaultVal;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val.en || val.he || val.name || val.description || defaultVal;
    }
    return String(val);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString(isRTL ? 'he-IL' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getCurrencySign = () => {
    const curr = order.currency;
    if (curr === 'ILS' || curr === 'NIS') return '₪';
    if (curr === 'USD') return '$';
    if (curr === 'EUR') return '€';
    if (curr === 'GBP') return '£';
    return curr || '$';
  };

  const getLocationString = () => {
    if (order.insideDelivery?.location) {
      return getName(order.insideDelivery.location);
    }
    const { section, row, seatNo, room, floor } = order.seatInfo || {};
    const parts = [];
    if (room) parts.push(`Room: ${room}`);
    if (floor) parts.push(`Floor: ${floor}`);
    if (section) parts.push(`Section: ${getName(section)}`);
    if (row) parts.push(`Row: ${getName(row)}`);
    if (seatNo) parts.push(`Seat: ${getName(seatNo)}`);
    return parts.join(', ') || 'N/A';
  };

  // Assign delivery person to order
  const handleAssignDeliveryPerson = async () => {
    if (!selectedDeliveryPerson) return;

    try {
      setAssigning(true);
      setAssignmentMessage('');

      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        deliveryUserId: selectedDeliveryPerson,
        updatedAt: new Date()
      });

      setAssignmentMessage('Delivery person assigned successfully!');
      setSelectedDeliveryPerson('');

      // Close dialog after successful assignment
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error assigning delivery person:', error);
      setAssignmentMessage('Failed to assign delivery person. Please try again.');
    } finally {
      setAssigning(false);
    }
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
            {t('orders.orderDetails')} #{getName(order.orderCode || order.id)}
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
            label={t(`orderStatus.${order.status}`)}
            color="primary"
            sx={{ fontWeight: 600, minWidth: 100 }}
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
            <Typography><strong>Name:</strong> {getName(order.userInfo?.userName)}</Typography>
            <Typography><strong>Email:</strong> {getName(order.userInfo?.userEmail)}</Typography>
            <Typography><strong>Phone:</strong> {getName(order.userInfo?.userPhoneNo)}</Typography>

            <Divider sx={{ my: 1.5 }} />

            <Typography>
              <strong>Method:</strong> {order.deliveryMethod === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
              {order.deliveryType && ` (${getName(order.deliveryType)})`}
            </Typography>

            {/* Granular Location Info */}
            {order.insideDelivery?.location && (
              <Typography sx={{ mt: 0.5 }}><strong>Point:</strong> {getName(order.insideDelivery.location)}</Typography>
            )}
            {order.seatInfo?.room && (
              <Typography sx={{ mt: 0.5 }}><strong>Room:</strong> {getName(order.seatInfo.room)}</Typography>
            )}
            {order.seatInfo?.floor && (
              <Typography sx={{ mt: 0.5 }}><strong>Floor:</strong> {getName(order.seatInfo.floor)}</Typography>
            )}
            {order.seatInfo?.stand && (
              <Typography sx={{ mt: 0.5 }}><strong>Stand:</strong> {getName(order.seatInfo.stand)}</Typography>
            )}
            {order.seatInfo?.area && (
              <Typography sx={{ mt: 0.5 }}><strong>Area:</strong> {getName(order.seatInfo.area)}</Typography>
            )}
            {order.seatInfo?.section && (
              <Typography sx={{ mt: 0.5 }}><strong>Section:</strong> {getName(order.seatInfo.section)}</Typography>
            )}
            {order.seatInfo?.row && (
              <Typography sx={{ mt: 0.5 }}><strong>Row:</strong> {getName(order.seatInfo.row)}</Typography>
            )}
            {order.seatInfo?.seatNo && (
              <Typography sx={{ mt: 0.5 }}><strong>Seat:</strong> {getName(order.seatInfo.seatNo)}</Typography>
            )}
            {order.seatInfo?.entrance && (
              <Typography sx={{ mt: 0.5 }}><strong>Entrance:</strong> {getName(order.seatInfo.entrance)}</Typography>
            )}
            {order.outsideDelivery?.location && (
              <Typography sx={{ mt: 0.5 }}><strong>Outside Point:</strong> {getName(order.outsideDelivery.location)}</Typography>
            )}
            {order.pickupId && pickupPoints[order.pickupId] && (
              <>
                <Typography sx={{ mt: 0.5 }}><strong>Pickup Point:</strong> {getName(pickupPoints[order.pickupId].name)}</Typography>
                {pickupPoints[order.pickupId].area && (
                  <Typography sx={{ mt: 0.5 }}><strong>Area:</strong> {getName(pickupPoints[order.pickupId].area)}</Typography>
                )}
                {pickupPoints[order.pickupId].description && (
                  <Typography sx={{ mt: 0.5 }}><strong>Description:</strong> {getName(pickupPoints[order.pickupId].description)}</Typography>
                )}
              </>
            )}

            {(order.seatInfo?.seatDetails || order.insideDelivery?.notes) && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>📝 Notes:</Typography>
                {order.seatInfo?.seatDetails && (
                  <Typography variant="body2">{getName(order.seatInfo.seatDetails)}</Typography>
                )}
                {order.insideDelivery?.notes && (
                  <Typography variant="body2" sx={{ mt: order.seatInfo?.seatDetails ? 0.5 : 0 }}>
                    {getName(order.insideDelivery.notes)}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Delivery Person Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{
            color: theme.palette.primary.main,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}>
            <LocalShipping /> Delivery Information
          </Typography>
          <Box sx={{
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            {order.deliveryUserId && deliveryUsers && deliveryUsers[order.deliveryUserId] ? (
              (() => {
                const deliveryPerson = deliveryUsers[order.deliveryUserId];
                return (
                  <Box>
                    <Typography><strong>Name:</strong> {getName(deliveryPerson.name || `${deliveryPerson.firstName} ${deliveryPerson.lastName}`)}</Typography>
                    <Typography><strong>Email:</strong> {getName(deliveryPerson.email)}</Typography>
                    <Typography><strong>Phone:</strong> {getName(deliveryPerson.phone || deliveryPerson.phoneNumber)}</Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85em', mt: 1 }}>
                      <strong>Delivery ID:</strong> {deliveryPerson.id || 'N/A'}
                    </Typography>

                    {/* Reassignment UI - Only for admin@fanmunch.com */}
                    {currentUser?.email === 'admin@fanmunch.com' && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.primary.main }}>
                            <AssignmentTurnedIn sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Reassign Delivery Person
                          </Typography>

                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Select New Delivery Person</InputLabel>
                            <Select
                              value={selectedDeliveryPerson}
                              label="Select New Delivery Person"
                              onChange={(e) => setSelectedDeliveryPerson(e.target.value)}
                            >
                              {deliveryUsers && Object.values(deliveryUsers)
                                .filter(person => person.isActive === true)
                                .map((person) => (
                                  <MenuItem key={person.id} value={person.id}>
                                    {getName(person.name || `${person.firstName} ${person.lastName}`)} - {person.email}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>

                          <Button
                            variant="outlined"
                            onClick={handleAssignDeliveryPerson}
                            disabled={!selectedDeliveryPerson || assigning}
                            sx={{ mr: 1 }}
                          >
                            {assigning ? 'Reassigning...' : 'Reassign Delivery Person'}
                          </Button>

                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            This will replace the current delivery person assignment.
                          </Typography>

                          {assignmentMessage && (
                            <Alert
                              severity={assignmentMessage.includes('successfully') ? 'success' : 'error'}
                              sx={{ mt: 2 }}
                            >
                              {assignmentMessage}
                            </Alert>
                          )}
                        </Box>
                      </>
                    )}
                  </Box>
                );
              })()
            ) : (
              <Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  <strong>No delivery person currently assigned</strong>
                </Typography>

                {/* Assignment UI - Only for admin@fanmunch.com */}
                {currentUser?.email === 'admin@fanmunch.com' && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.primary.main }}>
                      <AssignmentTurnedIn sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Assign Delivery Person
                    </Typography>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Select Delivery Person</InputLabel>
                      <Select
                        value={selectedDeliveryPerson}
                        label="Select Delivery Person"
                        onChange={(e) => setSelectedDeliveryPerson(e.target.value)}
                      >
                        {deliveryUsers && Object.values(deliveryUsers)
                          .filter(person => person.isActive === true)
                          .map((person) => (
                            <MenuItem key={person.id} value={person.id}>
                              {getName(person.name || `${person.firstName} ${person.lastName}`)} - {person.email}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>

                    <Button
                      variant="contained"
                      onClick={handleAssignDeliveryPerson}
                      disabled={!selectedDeliveryPerson || assigning}
                      sx={{ mr: 1 }}
                    >
                      {assigning ? 'Assigning...' : 'Assign Delivery Person'}
                    </Button>

                    {assignmentMessage && (
                      <Alert
                        severity={assignmentMessage.includes('successfully') ? 'success' : 'error'}
                        sx={{ mt: 2 }}
                      >
                        {assignmentMessage}
                      </Alert>
                    )}
                  </Box>
                )}
              </Box>
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
                mb: 2,
                pb: 1,
                borderBottom: index !== order.cart.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography fontWeight="500">{getName(item.name)}</Typography>
                  <Typography sx={{ color: 'text.secondary' }}>×{item.quantity}</Typography>
                </Box>

                {/* Options */}
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1 }}>
                    + {item.selectedOptions.map(opt => getName(opt)).join(', ')}
                  </Typography>
                )}

                {/* Combo Details */}
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
              <Typography>{getCurrencySign()}{order.subtotal}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Delivery Fee:</Typography>
              <Typography>{getCurrencySign()}{order.deliveryFee}</Typography>
            </Box>
            {order.tipAmount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Tip:</Typography>
                <Typography>{getCurrencySign()}{order.tipAmount}</Typography>
              </Box>
            )}
            {order.discount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Discount:</Typography>
                <Typography color="error.main">-{getCurrencySign()}{order.discount}</Typography>
              </Box>
            )}
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total:</Typography>
              <Typography variant="subtitle1" sx={{
                fontWeight: 600,
                color: theme.palette.primary.main
              }}>
                {getCurrencySign()}{order.total}
              </Typography>
            </Box>
            <Chip
              icon={<Payment fontSize="small" />}
              label={order.paymentMethod === 1 ? t('paymentMethod.card') : t('paymentMethod.cash')}
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
