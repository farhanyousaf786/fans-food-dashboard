import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, storage } from '../../../config/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Switch,
  FormControlLabel,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox
} from '@mui/material';
import { Edit, Delete, Add as AddIcon } from '@mui/icons-material';
import Shop from '../../../models/Shop';
import './MyShopsSection.css';

const MyShopsSection = () => {
  const navigate = useNavigate();
  const { id: stadiumId } = useParams();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [shopToDelete, setShopToDelete] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newShop, setNewShop] = useState({
    name: '',
    location: '',
    floor: '',
    gate: '',
    description: '',
    deliveryFee: '',
    deliveryFeeCurrency: 'ILS',
    imageFile: null,
    imagePreview: null,
    insideDelivery: {
      enabled: false,
      fee: '',
      currency: 'ILS',
      openTime: '09:00',
      closeTime: '22:00',
      locations: []
    },
    outsideDelivery: {
      enabled: false,
      fee: '',
      currency: 'ILS',
      openTime: '09:00',
      closeTime: '22:00',
      locations: []
    }
  });
  const [expanded, setExpanded] = useState(true);

  const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode) {
      case 'ILS':
        return '₪';
      case 'USD':
        return '$';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchShops = async () => {
      try {
        // Get shops filtered by current stadiumId
        const shopsCollection = collection(db, 'shops');
        const q = query(shopsCollection, where('stadiumId', '==', stadiumId));
        const shopsSnapshot = await getDocs(q);
        const stadiumShops = shopsSnapshot.docs.map(doc => {
          const rawData = doc.data();
          return Shop.fromFirestore(rawData, doc.id);
        });

        console.log('🏪 MY SHOPS SECTION: Shops for stadium', stadiumId, ':', stadiumShops.length);
        setShops(stadiumShops);
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, [stadiumId]);

  const handleAddShop = () => {
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setNewShop({
      name: '',
      location: '',
      floor: '',
      gate: '',
      description: '',
      deliveryFee: '',
      deliveryFeeCurrency: 'ILS',
      imageFile: null,
      imagePreview: null,
      insideDelivery: {
        enabled: false,
        fee: '',
        currency: 'ILS',
        openTime: '09:00',
        closeTime: '22:00'
      },
      outsideDelivery: {
        enabled: false,
        fee: '',
        currency: 'ILS',
        openTime: '09:00',
        closeTime: '22:00'
      }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewShop({
        ...newShop,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleCreateShop = async () => {
    try {
      let imageUrl = null;

      // Upload image if provided
      if (newShop.imageFile) {
        const imageRef = ref(storage, `shops / ${Date.now()}_${newShop.imageFile.name} `);
        await uploadBytes(imageRef, newShop.imageFile);
        imageUrl = await getDownloadURL(imageRef);
        console.log('✅ Image uploaded successfully:', imageUrl);
      }

      // Create new Shop instance
      const shop = new Shop(
        newShop.name,
        newShop.location,
        newShop.floor,
        newShop.gate,
        newShop.description,
        [], // No admins for now, admin can assign later
        stadiumId,
        null, // stadiumName
        null, // latitude
        null, // longitude
        null, // docId
        imageUrl, // imageUrl
        newShop.deliveryFee ? parseFloat(newShop.deliveryFee) : 0, // deliveryFee
        newShop.deliveryFeeCurrency || 'ILS', // deliveryFeeCurrency
        newShop.insideDelivery, // insideDelivery
        newShop.outsideDelivery // outsideDelivery
      );

      // Add to Firestore
      const shopData = shop.toFirestore();
      const shopDocRef = await addDoc(collection(db, 'shops'), shopData);
      console.log('✅ Shop created successfully:', shopDocRef.id);

      // Update local state
      setShops(prev => [...prev, { id: shopDocRef.id, ...shopData }]);

      handleCloseAddDialog();
    } catch (error) {
      console.error('Error creating shop:', error);
    }
  };

  const handleToggleAvailability = async (shop, e) => {
    e.stopPropagation();
    const newValue = !shop.shopAvailability;
    // Optimistic UI update
    setShops(prev => prev.map(s => s.id === shop.id ? { ...s, shopAvailability: newValue } : s));

    try {
      const shopRef = doc(db, 'shops', shop.id);
      await updateDoc(shopRef, { shopAvailability: newValue });
    } catch (error) {
      console.error('Error updating shop availability:', error);
      // Revert on error
      setShops(prev => prev.map(s => s.id === shop.id ? { ...s, shopAvailability: !newValue } : s));
    }
  };

  const handleEditShop = (shop, e) => {
    e.stopPropagation();
    setEditingShop(shop);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingShop(null);
  };

  const handleUpdateShop = async () => {
    if (!editingShop) return;

    try {
      const shopRef = doc(db, 'shops', editingShop.id);
      await updateDoc(shopRef, {
        name: editingShop.name,
        location: editingShop.location,
        floor: editingShop.floor,
        gate: editingShop.gate,
        description: editingShop.description,
        deliveryFee: editingShop.deliveryFee ? parseFloat(editingShop.deliveryFee) : 0,
        deliveryFeeCurrency: editingShop.deliveryFeeCurrency || 'ILS',
        insideDelivery: {
          enabled: editingShop.insideDelivery?.enabled || false,
          fee: editingShop.insideDelivery?.fee ? parseFloat(editingShop.insideDelivery.fee) : 0,
          currency: editingShop.insideDelivery?.currency || 'ILS',
          openTime: editingShop.insideDelivery?.openTime || '09:00',
          closeTime: editingShop.insideDelivery?.closeTime || '22:00',
          locations: editingShop.insideDelivery?.locations || []
        },
        outsideDelivery: {
          enabled: editingShop.outsideDelivery?.enabled || false,
          fee: editingShop.outsideDelivery?.fee ? parseFloat(editingShop.outsideDelivery.fee) : 0,
          currency: editingShop.outsideDelivery?.currency || 'ILS',
          openTime: editingShop.outsideDelivery?.openTime || '09:00',
          closeTime: editingShop.outsideDelivery?.closeTime || '22:00',
          locations: editingShop.outsideDelivery?.locations || []
        }
      });

      // Update local state
      setShops(prev => prev.map(shop =>
        shop.id === editingShop.id ? editingShop : shop
      ));

      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating shop:', error);
    }
  };

  const handleOpenDeleteDialog = (shop, event) => {
    event.stopPropagation();
    setShopToDelete(shop);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setShopToDelete(null);
  };

  const handleDeleteShop = async () => {
    if (!shopToDelete) return;

    try {
      console.log('🗑️ MY SHOPS SECTION: Deleting shop:', shopToDelete.id);

      // Delete shop from Firestore
      await deleteDoc(doc(db, 'shops', shopToDelete.id));

      // Remove shop from local state
      setShops(prev => prev.filter(shop => shop.id !== shopToDelete.id));

      console.log('✅ MY SHOPS SECTION: Shop deleted successfully');
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('❌ MY SHOPS SECTION: Error deleting shop:', error);
    }
  };

  if (loading) {
    return <p className="loading-message">Loading shops...</p>;
  }

  return (
    <>
      {/* Add Shop Button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddShop}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          Add Shop
        </Button>
      </Box>

      {shops.length === 0 ? (
        <div className="empty-message">
          <Typography variant="h6">
            No shops found in this stadium.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click "Add Shop" to create the first shop for this stadium.
          </Typography>
        </div>
      ) : (
        <div className="shop-grid-wrapper">
          <div className="shop-grid-container">
            {shops.map((shop) => (
              <Card
                key={shop.id}
                className="shop-card"
                onClick={(e) => e.stopPropagation()}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 3, transform: 'scale(1.01)' },
                  transition: 'all 0.2s ease'
                }}
              >
                <CardContent className="shop-card-content">
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography className="shop-name">
                        {shop.name}
                      </Typography>
                      <Typography className="shop-details">
                        🏟️ {shop.stadiumName}
                      </Typography>
                      <Typography className="shop-details">
                        📍 {shop.location}
                      </Typography>
                      <Typography className="shop-details">
                        🚪 Gate {shop.gate} • Floor {shop.floor}
                      </Typography>
                      {shop.description && (
                        <Typography className="shop-details">
                          {shop.description}
                        </Typography>
                      )}
                      <Typography className="shop-details" sx={{ color: '#4caf50', fontWeight: 500 }}>
                        🛵 Delivery Fee: {getCurrencySymbol(shop.deliveryFeeCurrency || 'ILS')}{shop.deliveryFee ? parseFloat(shop.deliveryFee).toFixed(2) : '0.00'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
                      <Tooltip title={shop.shopAvailability ? 'Shop is Open' : 'Shop is Closed'}>
                        <FormControlLabel
                          onClick={(e) => e.stopPropagation()}
                          control={
                            <Switch
                              checked={!!shop.shopAvailability}
                              onChange={(e) => handleToggleAvailability(shop, e)}
                              color="success"
                              size="small"
                            />
                          }
                          label={shop.shopAvailability ? 'Open' : 'Closed'}
                          sx={{ ml: 'auto' }}
                          componentsProps={{
                            typography: {
                              variant: 'caption'
                            }
                          }}
                        />
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box className="shop-actions">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        onClick={(e) => handleEditShop(shop, e)}
                        className="shop-icon-button"
                        sx={{
                          color: '#3D70FF',
                          '&:hover': {
                            backgroundColor: 'rgba(61, 112, 255, 0.1)'
                          }
                        }}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={(e) => handleOpenDeleteDialog(shop, e)}
                        className="shop-icon-button"
                        sx={{
                          color: '#dc004e',
                          '&:hover': {
                            backgroundColor: 'rgba(220, 0, 78, 0.1)'
                          }
                        }}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      className="shop-go-button"
                      onClick={() => navigate('/dashboard', { state: { shopData: shop } })}
                    >
                      Go to Shop
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Shop Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Shop</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Shop Name"
            fullWidth
            value={editingShop?.name || ''}
            onChange={(e) => setEditingShop(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Location in Stadium"
            fullWidth
            value={editingShop?.location || ''}
            onChange={(e) => setEditingShop(prev => ({ ...prev, location: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Floor"
            fullWidth
            value={editingShop?.floor || ''}
            onChange={(e) => setEditingShop(prev => ({ ...prev, floor: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Gate Number"
            fullWidth
            value={editingShop?.gate || ''}
            onChange={(e) => setEditingShop(prev => ({ ...prev, gate: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={editingShop?.description || ''}
            onChange={(e) => setEditingShop(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Delivery Fee"
            fullWidth
            type="number"
            value={editingShop?.deliveryFee || ''}
            onChange={(e) => setEditingShop(prev => ({ ...prev, deliveryFee: e.target.value }))}
            helperText="Enter delivery fee amount (e.g., 5.00)"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={editingShop?.deliveryFeeCurrency || 'ILS'}
              onChange={(e) => setEditingShop(prev => ({ ...prev, deliveryFeeCurrency: e.target.value }))}
              label="Currency"
            >
              <MenuItem value="ILS">₪ ILS (Israeli Shekel)</MenuItem>
              <MenuItem value="USD">$ USD (US Dollar)</MenuItem>
              <MenuItem value="EUR">€ EUR (Euro)</MenuItem>
            </Select>
          </FormControl>

          {/* Inside Delivery Section */}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
              🏠 Inside Delivery (Stadium)
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editingShop?.insideDelivery?.enabled || false}
                  onChange={(e) => setEditingShop(prev => ({
                    ...prev,
                    insideDelivery: { ...prev.insideDelivery, enabled: e.target.checked }
                  }))}
                />
              }
              label="Enable Inside Delivery"
            />
            {editingShop?.insideDelivery?.enabled && (
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                  <TextField
                    margin="dense"
                    label="Fee"
                    type="number"
                    inputProps={{ min: "0", step: "0.01" }}
                    fullWidth
                    value={editingShop?.insideDelivery?.fee || ''}
                    onChange={(e) => setEditingShop(prev => ({
                      ...prev,
                      insideDelivery: { ...prev.insideDelivery, fee: e.target.value }
                    }))}
                  />
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={editingShop?.insideDelivery?.currency || 'ILS'}
                      onChange={(e) => setEditingShop(prev => ({
                        ...prev,
                        insideDelivery: { ...prev.insideDelivery, currency: e.target.value }
                      }))}
                      label="Currency"
                    >
                      <MenuItem value="ILS">ILS (₪)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <TextField
                    margin="dense"
                    label="Open Time"
                    type="time"
                    fullWidth
                    value={editingShop?.insideDelivery?.openTime || '09:00'}
                    onChange={(e) => setEditingShop(prev => ({
                      ...prev,
                      insideDelivery: { ...prev.insideDelivery, openTime: e.target.value }
                    }))}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    margin="dense"
                    label="Close Time"
                    type="time"
                    fullWidth
                    value={editingShop?.insideDelivery?.closeTime || '22:00'}
                    onChange={(e) => setEditingShop(prev => ({
                      ...prev,
                      insideDelivery: { ...prev.insideDelivery, closeTime: e.target.value }
                    }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                {/* Delivery Locations */}
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #ddd' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    📍 Delivery Locations
                  </Typography>
                  {(editingShop?.insideDelivery?.locations || []).map((loc, idx) => (
                    <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: '#fff', borderRadius: 0.5, border: '1px solid #e0e0e0' }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, alignItems: 'flex-start' }}>
                        <Box>
                          <TextField
                            margin="dense"
                            label="Location Name"
                            size="small"
                            fullWidth
                            value={loc.name || ''}
                            onChange={(e) => {
                              const updated = [...(editingShop.insideDelivery?.locations || [])];
                              updated[idx] = { ...loc, name: e.target.value };
                              setEditingShop(prev => ({
                                ...prev,
                                insideDelivery: { ...prev.insideDelivery, locations: updated }
                              }));
                            }}
                          />
                          <TextField
                            margin="dense"
                            label="Description"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={loc.description || ''}
                            onChange={(e) => {
                              const updated = [...(editingShop.insideDelivery?.locations || [])];
                              updated[idx] = { ...loc, description: e.target.value };
                              setEditingShop(prev => ({
                                ...prev,
                                insideDelivery: { ...prev.insideDelivery, locations: updated }
                              }));
                            }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const updated = (editingShop.insideDelivery?.locations || []).filter((_, i) => i !== idx);
                            setEditingShop(prev => ({
                              ...prev,
                              insideDelivery: { ...prev.insideDelivery, locations: updated }
                            }));
                          }}
                          sx={{ color: '#dc004e' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const updated = [...(editingShop.insideDelivery?.locations || []), { name: '', description: '' }];
                      setEditingShop(prev => ({
                        ...prev,
                        insideDelivery: { ...prev.insideDelivery, locations: updated }
                      }));
                    }}
                    sx={{ mt: 1 }}
                  >
                    Add Location
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {/* Outside Delivery Section */}
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#d32f2f' }}>
              🚚 Outside Delivery
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editingShop?.outsideDelivery?.enabled || false}
                  onChange={(e) => setEditingShop(prev => ({
                    ...prev,
                    outsideDelivery: { ...prev.outsideDelivery, enabled: e.target.checked }
                  }))}
                />
              }
              label="Enable Outside Delivery"
            />
            {editingShop?.outsideDelivery?.enabled && (
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                  <TextField
                    margin="dense"
                    label="Fee"
                    type="number"
                    inputProps={{ min: "0", step: "0.01" }}
                    fullWidth
                    value={editingShop?.outsideDelivery?.fee || ''}
                    onChange={(e) => setEditingShop(prev => ({
                      ...prev,
                      outsideDelivery: { ...prev.outsideDelivery, fee: e.target.value }
                    }))}
                  />
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={editingShop?.outsideDelivery?.currency || 'ILS'}
                      onChange={(e) => setEditingShop(prev => ({
                        ...prev,
                        outsideDelivery: { ...prev.outsideDelivery, currency: e.target.value }
                      }))}
                      label="Currency"
                    >
                      <MenuItem value="ILS">ILS (₪)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <TextField
                    margin="dense"
                    label="Open Time"
                    type="time"
                    fullWidth
                    value={editingShop?.outsideDelivery?.openTime || '09:00'}
                    onChange={(e) => setEditingShop(prev => ({
                      ...prev,
                      outsideDelivery: { ...prev.outsideDelivery, openTime: e.target.value }
                    }))}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    margin="dense"
                    label="Close Time"
                    type="time"
                    fullWidth
                    value={editingShop?.outsideDelivery?.closeTime || '22:00'}
                    onChange={(e) => setEditingShop(prev => ({
                      ...prev,
                      outsideDelivery: { ...prev.outsideDelivery, closeTime: e.target.value }
                    }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                {/* Delivery Locations */}
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #ddd' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    📍 Delivery Locations
                  </Typography>
                  {(editingShop?.outsideDelivery?.locations || []).map((loc, idx) => (
                    <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: '#fff', borderRadius: 0.5, border: '1px solid #e0e0e0' }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, alignItems: 'flex-start' }}>
                        <Box>
                          <TextField
                            margin="dense"
                            label="Location Name"
                            size="small"
                            fullWidth
                            value={loc.name || ''}
                            onChange={(e) => {
                              const updated = [...(editingShop.outsideDelivery?.locations || [])];
                              updated[idx] = { ...loc, name: e.target.value };
                              setEditingShop(prev => ({
                                ...prev,
                                outsideDelivery: { ...prev.outsideDelivery, locations: updated }
                              }));
                            }}
                          />
                          <TextField
                            margin="dense"
                            label="Description"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={loc.description || ''}
                            onChange={(e) => {
                              const updated = [...(editingShop.outsideDelivery?.locations || [])];
                              updated[idx] = { ...loc, description: e.target.value };
                              setEditingShop(prev => ({
                                ...prev,
                                outsideDelivery: { ...prev.outsideDelivery, locations: updated }
                              }));
                            }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const updated = (editingShop.outsideDelivery?.locations || []).filter((_, i) => i !== idx);
                            setEditingShop(prev => ({
                              ...prev,
                              outsideDelivery: { ...prev.outsideDelivery, locations: updated }
                            }));
                          }}
                          sx={{ color: '#dc004e' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const updated = [...(editingShop.outsideDelivery?.locations || []), { name: '', description: '' }];
                      setEditingShop(prev => ({
                        ...prev,
                        outsideDelivery: { ...prev.outsideDelivery, locations: updated }
                      }));
                    }}
                    sx={{ mt: 1 }}
                  >
                    Add Location
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateShop} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Shop</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the shop "{shopToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteShop}
            variant="contained"
            sx={{
              backgroundColor: '#dc004e',
              '&:hover': { backgroundColor: '#b8003d' }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Shop Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Shop</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Shop Name"
            fullWidth
            value={newShop.name}
            onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Location in Stadium"
            fullWidth
            value={newShop.location}
            onChange={(e) => setNewShop({ ...newShop, location: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Floor"
            fullWidth
            value={newShop.floor}
            onChange={(e) => setNewShop({ ...newShop, floor: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Gate Number"
            fullWidth
            value={newShop.gate}
            onChange={(e) => setNewShop({ ...newShop, gate: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newShop.description}
            onChange={(e) => setNewShop({ ...newShop, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Delivery Fee"
            fullWidth
            type="number"
            value={newShop.deliveryFee}
            onChange={(e) => setNewShop({ ...newShop, deliveryFee: e.target.value })}
            helperText="Enter delivery fee amount (e.g., 5.00)"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={newShop.deliveryFeeCurrency}
              onChange={(e) => setNewShop({ ...newShop, deliveryFeeCurrency: e.target.value })}
              label="Currency"
            >
              <MenuItem value="ILS">₪ ILS (Israeli Shekel)</MenuItem>
              <MenuItem value="USD">$ USD (US Dollar)</MenuItem>
              <MenuItem value="EUR">€ EUR (Euro)</MenuItem>
            </Select>
          </FormControl>

          {/* Inside Delivery Section */}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
              🏠 Inside Delivery (Stadium)
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newShop.insideDelivery?.enabled || false}
                  onChange={(e) => setNewShop({
                    ...newShop,
                    insideDelivery: { ...newShop.insideDelivery, enabled: e.target.checked }
                  })}
                />
              }
              label="Enable Inside Delivery"
            />
            {newShop.insideDelivery?.enabled && (
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                  <TextField
                    margin="dense"
                    label="Fee"
                    type="number"
                    inputProps={{ min: "0", step: "0.01" }}
                    fullWidth
                    value={newShop.insideDelivery?.fee || ''}
                    onChange={(e) => setNewShop({
                      ...newShop,
                      insideDelivery: { ...newShop.insideDelivery, fee: e.target.value }
                    })}
                  />
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={newShop.insideDelivery?.currency || 'ILS'}
                      onChange={(e) => setNewShop({
                        ...newShop,
                        insideDelivery: { ...newShop.insideDelivery, currency: e.target.value }
                      })}
                      label="Currency"
                    >
                      <MenuItem value="ILS">ILS (₪)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <TextField
                    margin="dense"
                    label="Open Time"
                    type="time"
                    fullWidth
                    value={newShop.insideDelivery?.openTime || '09:00'}
                    onChange={(e) => setNewShop({
                      ...newShop,
                      insideDelivery: { ...newShop.insideDelivery, openTime: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    margin="dense"
                    label="Close Time"
                    type="time"
                    fullWidth
                    value={newShop.insideDelivery?.closeTime || '22:00'}
                    onChange={(e) => setNewShop({
                      ...newShop,
                      insideDelivery: { ...newShop.insideDelivery, closeTime: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                {/* Delivery Locations */}
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #ddd' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    📍 Delivery Locations
                  </Typography>
                  {(newShop.insideDelivery?.locations || []).map((loc, idx) => (
                    <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: '#fff', borderRadius: 0.5, border: '1px solid #e0e0e0' }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, alignItems: 'flex-start' }}>
                        <Box>
                          <TextField
                            margin="dense"
                            label="Location Name"
                            size="small"
                            fullWidth
                            value={loc.name || ''}
                            onChange={(e) => {
                              const updated = [...(newShop.insideDelivery?.locations || [])];
                              updated[idx] = { ...loc, name: e.target.value };
                              setNewShop({
                                ...newShop,
                                insideDelivery: { ...newShop.insideDelivery, locations: updated }
                              });
                            }}
                          />
                          <TextField
                            margin="dense"
                            label="Description"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={loc.description || ''}
                            onChange={(e) => {
                              const updated = [...(newShop.insideDelivery?.locations || [])];
                              updated[idx] = { ...loc, description: e.target.value };
                              setNewShop({
                                ...newShop,
                                insideDelivery: { ...newShop.insideDelivery, locations: updated }
                              });
                            }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const updated = (newShop.insideDelivery?.locations || []).filter((_, i) => i !== idx);
                            setNewShop({
                              ...newShop,
                              insideDelivery: { ...newShop.insideDelivery, locations: updated }
                            });
                          }}
                          sx={{ color: '#dc004e' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const updated = [...(newShop.insideDelivery?.locations || []), { name: '', description: '' }];
                      setNewShop({
                        ...newShop,
                        insideDelivery: { ...newShop.insideDelivery, locations: updated }
                      });
                    }}
                    sx={{ mt: 1 }}
                  >
                    Add Location
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {/* Outside Delivery Section */}
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#d32f2f' }}>
              🚚 Outside Delivery
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newShop.outsideDelivery?.enabled || false}
                  onChange={(e) => setNewShop({
                    ...newShop,
                    outsideDelivery: { ...newShop.outsideDelivery, enabled: e.target.checked }
                  })}
                />
              }
              label="Enable Outside Delivery"
            />
            {newShop.outsideDelivery?.enabled && (
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                  <TextField
                    margin="dense"
                    label="Fee"
                    type="number"
                    inputProps={{ min: "0", step: "0.01" }}
                    fullWidth
                    value={newShop.outsideDelivery?.fee || ''}
                    onChange={(e) => setNewShop({
                      ...newShop,
                      outsideDelivery: { ...newShop.outsideDelivery, fee: e.target.value }
                    })}
                  />
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={newShop.outsideDelivery?.currency || 'ILS'}
                      onChange={(e) => setNewShop({
                        ...newShop,
                        outsideDelivery: { ...newShop.outsideDelivery, currency: e.target.value }
                      })}
                      label="Currency"
                    >
                      <MenuItem value="ILS">ILS (₪)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <TextField
                    margin="dense"
                    label="Open Time"
                    type="time"
                    fullWidth
                    value={newShop.outsideDelivery?.openTime || '09:00'}
                    onChange={(e) => setNewShop({
                      ...newShop,
                      outsideDelivery: { ...newShop.outsideDelivery, openTime: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    margin="dense"
                    label="Close Time"
                    type="time"
                    fullWidth
                    value={newShop.outsideDelivery?.closeTime || '22:00'}
                    onChange={(e) => setNewShop({
                      ...newShop,
                      outsideDelivery: { ...newShop.outsideDelivery, closeTime: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                {/* Delivery Locations */}
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #ddd' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    📍 Delivery Locations
                  </Typography>
                  {(newShop.outsideDelivery?.locations || []).map((loc, idx) => (
                    <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: '#fff', borderRadius: 0.5, border: '1px solid #e0e0e0' }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, alignItems: 'flex-start' }}>
                        <Box>
                          <TextField
                            margin="dense"
                            label="Location Name"
                            size="small"
                            fullWidth
                            value={loc.name || ''}
                            onChange={(e) => {
                              const updated = [...(newShop.outsideDelivery?.locations || [])];
                              updated[idx] = { ...loc, name: e.target.value };
                              setNewShop({
                                ...newShop,
                                outsideDelivery: { ...newShop.outsideDelivery, locations: updated }
                              });
                            }}
                          />
                          <TextField
                            margin="dense"
                            label="Description"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={loc.description || ''}
                            onChange={(e) => {
                              const updated = [...(newShop.outsideDelivery?.locations || [])];
                              updated[idx] = { ...loc, description: e.target.value };
                              setNewShop({
                                ...newShop,
                                outsideDelivery: { ...newShop.outsideDelivery, locations: updated }
                              });
                            }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const updated = (newShop.outsideDelivery?.locations || []).filter((_, i) => i !== idx);
                            setNewShop({
                              ...newShop,
                              outsideDelivery: { ...newShop.outsideDelivery, locations: updated }
                            });
                          }}
                          sx={{ color: '#dc004e' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const updated = [...(newShop.outsideDelivery?.locations || []), { name: '', description: '' }];
                      setNewShop({
                        ...newShop,
                        outsideDelivery: { ...newShop.outsideDelivery, locations: updated }
                      });
                    }}
                    sx={{ mt: 1 }}
                  >
                    Add Location
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mb: 2, mt: 2 }}
          >
            Upload Shop Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>
          {newShop.imagePreview && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img
                src={newShop.imagePreview}
                alt="Shop preview"
                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleCreateShop} variant="contained">Create Shop</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MyShopsSection;
