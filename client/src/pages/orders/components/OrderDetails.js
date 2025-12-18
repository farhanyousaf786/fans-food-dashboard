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

const OrderDetails = ({ order, open, onClose, restaurantName, deliveryUsers, currentUser }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  
  // Assignment state
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = React.useState('');
  const [assigning, setAssigning] = React.useState(false);
  const [assignmentMessage, setAssignmentMessage] = React.useState('');
  
  if (!order) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleString(isRTL ? 'he-IL' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
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
            {t('orders.orderDetails')}
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
            <Typography><strong>Name:</strong> {order.userInfo?.userName || 'N/A'}</Typography>
            <Typography><strong>Email:</strong> {order.userInfo?.userEmail || 'N/A'}</Typography>
            <Typography><strong>Phone:</strong> {order.userInfo?.userPhoneNo || 'N/A'}</Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85em', mt: 1 }}>
              <strong>User ID:</strong> {order.userInfo?.userId || 'N/A'}
            </Typography>
            <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: '0.85em' }}>
              <strong>Last Updated:</strong> {order.updatedAt ? formatDate(order.updatedAt) : 'N/A'}
            </Typography>
            {order.seatInfo && (
              <Typography sx={{ mt: 1 }}>
                <strong>Seat:</strong> Section {order.seatInfo.section}, 
                Row {order.seatInfo.row}, 
                Seat {order.seatInfo.seatNo}
              </Typography>
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
                    <Typography><strong>Name:</strong> {deliveryPerson.name || 'N/A'}</Typography>
                    <Typography><strong>Email:</strong> {deliveryPerson.email || 'N/A'}</Typography>
                    <Typography><strong>Phone:</strong> {deliveryPerson.phone || 'N/A'}</Typography>
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
                                    {person.name} - {person.email}
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
                              {person.name} - {person.email}
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
