import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material';
import {
  Delete,
  LocalOffer,
  AccessTime,
  Circle
} from '@mui/icons-material';
import { collection, query, onSnapshot, doc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import './OfferList.css';

const OfferList = ({ shopData }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [readMoreDialogOpen, setReadMoreDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!shopData?.id || !shopData?.stadiumId) return;

    const offersRef = collection(db, 'offers');
    const q = query(
      offersRef,
      where('stadiumId', '==', shopData.stadiumId),
      where('shopId', '==', shopData.id),
      where('active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const offersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOffers(offersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shopData]);

  const handleDelete = (offer) => {
    setSelectedOffer(offer);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedOffer?.id) return;

      const offerRef = doc(db, 'offers', selectedOffer.id);
      await deleteDoc(offerRef);
      
      setSuccess('Offer deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting offer:', error);
      setError('Failed to delete offer');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <Box sx={{ p: 2 }}>Loading offers...</Box>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Active Offers
      </Typography>

      <Grid container spacing={3}>
        {offers.map((offer) => (
          <Grid item xs={12} sm={6} md={4} key={offer.id}>
            <Card sx={{ display: 'flex', height: 220, overflow: 'hidden' }}>
              <CardMedia
                component="img"
                image={offer.images?.[0] || '/placeholder.jpg'}
                alt={offer.name}
                sx={{ width: 220, height: 220, objectFit: 'cover' }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                      {offer.name}
                    </Typography>
                    {offer.description && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {offer.description.split(' ').slice(0, 5).join(' ')}
                          {offer.description.split(' ').length > 5 ? '...' : ''}
                        </Typography>
                        <Button 
                          size="small" 
                          sx={{ minWidth: 'auto', p: 0, color: 'primary.main', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedOffer(offer);
                            setReadMoreDialogOpen(true);
                          }}
                        >
                          Read More
                        </Button>
                      </Box>
                    )}
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(offer)}
                    sx={{ color: 'error.main', padding: '4px' }}
                  >
                    <Delete sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>

                <Chip
                  icon={<LocalOffer sx={{ fontSize: 16 }} />}
                  label={`${offer.discountPercentage}% OFF`}
                  color="secondary"
                  size="small"
                  sx={{ alignSelf: 'flex-start', mb: 2 }}
                />

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Original Price: ${(offer.price || 0).toFixed(2)}
                </Typography>
                <Typography variant="h6" color="secondary" sx={{ fontSize: '1.1rem' }}>
                  Discounted: ${((offer.price || 0) * (1 - (offer.discountPercentage || 0)/100)).toFixed(2)}
                </Typography>

                <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                  <Chip
                    icon={<Circle sx={{ fontSize: 10 }} />}
                    label={offer.isAvailable ? 'Available' : 'Unavailable'}
                    color={offer.isAvailable ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24 }}
                  />
                  <Chip
                    icon={<AccessTime sx={{ fontSize: 10 }} />}
                    label={`${offer.preparationTime} min`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24 }}
                  />
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}

        {offers.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <LocalOffer sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
              <Typography>No active offers at the moment</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete Offer</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the offer for "{selectedOffer?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Read More Dialog */}
      <Dialog 
        open={readMoreDialogOpen} 
        onClose={() => setReadMoreDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>{selectedOffer?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
            <Typography>{selectedOffer?.description}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Price Details</Typography>
            <Typography>Original Price: ${(selectedOffer?.price || 0).toFixed(2)}</Typography>
            <Typography>Discount: {selectedOffer?.discountPercentage}%</Typography>
            <Typography color="secondary.main" sx={{ fontWeight: 600 }}>
              Final Price: ${((selectedOffer?.price || 0) * (1 - (selectedOffer?.discountPercentage || 0)/100)).toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Additional Information</Typography>
            <Typography>Category: {selectedOffer?.category}</Typography>
            <Typography>Preparation Time: {selectedOffer?.preparationTime} minutes</Typography>
            <Typography>Status: {selectedOffer?.isAvailable ? 'Available' : 'Unavailable'}</Typography>
          </Box>

          {selectedOffer?.customization && Object.keys(selectedOffer.customization).length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Customization Options</Typography>
              {Object.entries(selectedOffer.customization).map(([type, options]) => (
                <Box key={type} sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{type}:</Typography>
                  {options.map((option, idx) => (
                    <Typography key={idx} variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      • {option.name} (${option.price})
                    </Typography>
                  ))}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReadMoreDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfferList;
