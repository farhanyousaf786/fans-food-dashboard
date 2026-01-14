import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tooltip,
  Checkbox,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import Shop from '../../models/Shop';
import '../admin/AdminPanel.css';

const ShopPanel = () => {
  const navigate = useNavigate();
  const [stadiums, setStadiums] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedStadiumId, setSelectedStadiumId] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [shopToDelete, setShopToDelete] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [newShop, setNewShop] = useState({
    name: '',
    location: '',
    floor: '',
    gate: '',
    description: '',
    latitude: '',
    longitude: '',
    admins: [],
    deliveryFee: '',
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Clear any stored shop data when viewing shop list
        localStorage.removeItem('currentShopData');
        const stadiumsCollection = collection(db, 'stadiums');
        const stadiumSnapshot = await getDocs(stadiumsCollection);
        const stadiumList = stadiumSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStadiums(stadiumList);

        // Get shops from root collection - only shops owned by current user
        const shopsCollection = collection(db, 'shops');
        const shopsSnapshot = await getDocs(shopsCollection);
        const allShops = shopsSnapshot.docs.map(doc => {
          const rawData = doc.data();
          console.log('🔍 RAW SHOP DATA from Firestore:', doc.id, rawData);
          return Shop.fromFirestore(rawData, doc.id);
        });

        // Filter shops to show only those owned by current user
        const userShops = allShops.filter(shop =>
          shop.admins && shop.admins.includes(auth.currentUser.uid)
        );

        console.log('🏪 SHOP PANEL: Total shops in database:', allShops.length);
        console.log('🏪 SHOP PANEL: User owns shops:', userShops.length);
        console.log('🏪 SHOP PANEL: User shop IDs:', userShops.map(shop => shop.docId));
        console.log('🔍 PROCESSED SHOP DATA:', userShops);

        setShops(userShops);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleAddShop = (stadiumId) => {
    setSelectedStadiumId(stadiumId);
    setOpenAddDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setNewShop({
      name: '',
      location: '',
      floor: '',
      gate: '',
      description: '',
      latitude: '',
      longitude: '',
      admins: [],
      deliveryFee: '',
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
      const stadiumName = stadiums.find(s => s.id === selectedStadiumId)?.name;
      let imageUrl = null;

      // Upload image if provided
      if (newShop.imageFile) {
        const imageRef = ref(storage, `shops/${Date.now()}_${newShop.imageFile.name}`);
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
        [auth.currentUser.uid],
        selectedStadiumId,
        stadiumName,
        newShop.latitude ? parseFloat(newShop.latitude) : null,
        newShop.longitude ? parseFloat(newShop.longitude) : null,
        null,
        null,
        newShop.deliveryFee ? parseFloat(newShop.deliveryFee) : 0,
        'ILS',
        newShop.insideDelivery,
        newShop.outsideDelivery
      );

      // First create shop in root collection
      const shopsRootCollection = collection(db, 'shops');
      const shopData = shop.toFirestore();
      if (imageUrl) {
        shopData.imageUrl = imageUrl;
      }
      // Ensure deliveryFee is included
      shopData.deliveryFee = newShop.deliveryFee ? parseFloat(newShop.deliveryFee) : 0;
      const shopDocRef = await addDoc(shopsRootCollection, shopData);

      // Update the shop instance and document with its own ID
      shop.docId = shopDocRef.id;
      await updateDoc(shopDocRef, { docId: shopDocRef.id });

      // Add shop ID to user's shopsId array (shop owners are in shopowners collection)
      const userDocRef = doc(db, 'shopowners', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentShopsId = userData.shopsId || [];

        // Add new shop ID to user's shops array
        const updatedShopsId = [...currentShopsId, shopDocRef.id];

        await updateDoc(userDocRef, {
          shopsId: updatedShopsId,
          updatedAt: new Date()
        });

        console.log('✅ SHOP CREATION: Shop ID added to user record:', shopDocRef.id);
        console.log('🏪 SHOP CREATION: User now has shops:', updatedShopsId);
      }

      handleCloseDialog();

      // Update local state with new shop
      const shopWithId = Shop.fromFirestore({ ...shop.toFirestore() }, shopDocRef.id);
      setShops(prev => [...prev, shopWithId]);
    } catch (error) {
      console.error('Error creating shop:', error);
    }
  };

  const handleDeleteShop = async () => {
    if (!shopToDelete) return;

    try {
      console.log('🗑️ SHOP PANEL: Deleting shop:', shopToDelete.id);

      // Delete shop from Firestore
      await deleteDoc(doc(db, 'shops', shopToDelete.id));

      // Remove shop from local state
      setShops(prev => prev.filter(shop => shop.id !== shopToDelete.id));

      console.log('✅ SHOP PANEL: Shop deleted successfully');
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('❌ SHOP PANEL: Error deleting shop:', error);
    }
  };

  const handleOpenDeleteDialog = (shop, event) => {
    event.stopPropagation(); // Prevent card click navigation
    setShopToDelete(shop);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setShopToDelete(null);
  };

  // Toggle shop availability (open/closed)
  const handleToggleAvailability = async (shop, e) => {
    e.stopPropagation();
    const newValue = !shop.shopAvailability;
    // Optimistic UI update
    setShops(prev => prev.map(s => s.id === shop.id ? { ...s, shopAvailability: newValue } : s));

    try {
      const shopRef = doc(db, 'shops', shop.id);
      await updateDoc(shopRef, { shopAvailability: newValue, updatedAt: new Date() });
    } catch (error) {
      console.error('❌ SHOP PANEL: Error updating availability:', error);
      // Revert on failure
      setShops(prev => prev.map(s => s.id === shop.id ? { ...s, shopAvailability: !newValue } : s));
    }
  };

  const handleEditShop = (shop, event) => {
    event.stopPropagation(); // Prevent card click navigation
    console.log('🔍 EDIT SHOP: Full shop object:', shop);
    console.log('🔍 EDIT SHOP: Latitude value:', shop.latitude, 'Type:', typeof shop.latitude);
    console.log('🔍 EDIT SHOP: Longitude value:', shop.longitude, 'Type:', typeof shop.longitude);

    setEditingShop(shop);
    setNewShop({
      name: shop.name || '',
      location: shop.location || '',
      floor: shop.floor || '',
      gate: shop.gate || '',
      description: shop.description || '',
      latitude: shop.latitude !== undefined && shop.latitude !== null ? shop.latitude.toString() : '',
      longitude: shop.longitude !== undefined && shop.longitude !== null ? shop.longitude.toString() : '',
      admins: shop.admins || [],
      deliveryFee: shop.deliveryFee !== undefined && shop.deliveryFee !== null ? shop.deliveryFee.toString() : '',
      insideDelivery: shop.insideDelivery || {
        enabled: false,
        fee: '',
        currency: 'ILS',
        openTime: '09:00',
        closeTime: '22:00'
      },
      outsideDelivery: shop.outsideDelivery || {
        enabled: false,
        fee: '',
        currency: 'ILS',
        openTime: '09:00',
        closeTime: '22:00'
      }
    });
    setOpenEditDialog(true);
  };

  const handleUpdateShop = async () => {
    if (!editingShop) return;

    try {
      console.log('✏️ SHOP PANEL: Updating shop:', editingShop.id);
      
      let imageUrl = editingShop.imageUrl || null;

      // Upload new image if provided
      if (newShop.imageFile) {
        const imageRef = ref(storage, `shops/${Date.now()}_${newShop.imageFile.name}`);
        await uploadBytes(imageRef, newShop.imageFile);
        imageUrl = await getDownloadURL(imageRef);
        console.log('✅ Image uploaded successfully:', imageUrl);
      }

      const shopRef = doc(db, 'shops', editingShop.id);
      const updatedShopData = {
        name: newShop.name,
        location: newShop.location,
        floor: newShop.floor,
        gate: newShop.gate,
        description: newShop.description,
        latitude: newShop.latitude ? parseFloat(newShop.latitude) : null,
        longitude: newShop.longitude ? parseFloat(newShop.longitude) : null,
        deliveryFee: newShop.deliveryFee ? parseFloat(newShop.deliveryFee) : 0,
        insideDelivery: {
          enabled: newShop.insideDelivery?.enabled || false,
          fee: newShop.insideDelivery?.fee ? parseFloat(newShop.insideDelivery.fee) : 0,
          currency: newShop.insideDelivery?.currency || 'ILS',
          openTime: newShop.insideDelivery?.openTime || '09:00',
          closeTime: newShop.insideDelivery?.closeTime || '22:00'
        },
        outsideDelivery: {
          enabled: newShop.outsideDelivery?.enabled || false,
          fee: newShop.outsideDelivery?.fee ? parseFloat(newShop.outsideDelivery.fee) : 0,
          currency: newShop.outsideDelivery?.currency || 'ILS',
          openTime: newShop.outsideDelivery?.openTime || '09:00',
          closeTime: newShop.outsideDelivery?.closeTime || '22:00'
        },
        updatedAt: new Date()
      };

      if (imageUrl) {
        updatedShopData.imageUrl = imageUrl;
      }

      await updateDoc(shopRef, updatedShopData);

      // Update local state
      setShops(prev => prev.map(shop => {
        if (shop.id === editingShop.id) {
          return {
            ...shop,
            ...updatedShopData
          };
        }
        return shop;
      }));

      console.log('✅ SHOP PANEL: Shop updated successfully');
      handleCloseEditDialog();
    } catch (error) {
      console.error('❌ SHOP PANEL: Error updating shop:', error);
    }
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingShop(null);
    setNewShop({
      name: '',
      location: '',
      floor: '',
      gate: '',
      description: '',
      latitude: '',
      longitude: '',
      admins: [],
      deliveryFee: '',
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
  };

  return (
    <div className="admin-container">
      <div className="header">
        <div className="header-content">
          <h1 className="page-title">Shop Panel</h1>
          <div className="header-actions">
            <Button
              onClick={handleLogout}
              variant="contained"
              className="logout-button"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="loading-message">Loading data...</p>
      ) : (
        <>
          <div className="section-header">
            <Typography variant="h5" sx={{ mb: 3 }}>My Shops</Typography>
          </div>
          {shops.length === 0 ? (
            <div className="empty-message">
              <Typography variant="h6">
                No shops yet. Add a shop to a stadium below.
              </Typography>
            </div>
          ) : (
            <div className="stadiums-grid">
              {shops.map((shop) => (
                <Card
                  className="stadium-card"
                  key={shop.id}
                  onClick={() => navigate('/dashboard', { state: { shopData: shop } })}
                  sx={{ cursor: 'pointer', '&:hover': { transform: 'scale(1.02)', transition: 'transform 0.2s' } }}
                >
                  <CardContent className="stadium-content">
                    <div className="stadium-header">
                      <Typography variant="h6" className="stadium-title">{shop.name}</Typography>
                      <div className="stadium-actions">
                        <Tooltip title={shop.shopAvailability ? 'Shop is Open' : 'Shop is Closed'}>
                          <FormControlLabel
                            onClick={(e) => e.stopPropagation()}
                            control={
                              <Switch
                                checked={!!shop.shopAvailability}
                                onChange={(e) => handleToggleAvailability(shop, e)}
                                color="success"
                              />
                            }
                            label={shop.shopAvailability ? 'Open' : 'Closed'}
                          />
                        </Tooltip>
                        <IconButton
                          onClick={(e) => handleEditShop(shop, e)}
                          sx={{
                            color: '#3D70FF',
                            '&:hover': {
                              backgroundColor: 'rgba(61, 112, 255, 0.1)'
                            }
                          }}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={(e) => handleOpenDeleteDialog(shop, e)}
                          sx={{
                            color: '#dc004e',
                            '&:hover': {
                              backgroundColor: 'rgba(220, 0, 78, 0.1)'
                            }
                          }}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>
                    </div>
                    <div className="stadium-info">
                      <Typography className="stadium-location"><span>🏟️</span>{shop.stadiumName}</Typography>
                      <Typography className="stadium-location"><span>📍</span>{shop.location}</Typography>
                      <Typography className="stadium-capacity"><span>🚪</span>Gate {shop.gate}, Floor {shop.floor}</Typography>
                      <Typography className="stadium-capacity"><span>🛵</span>Delivery Fee: {shop.deliveryFee ? shop.deliveryFee.toFixed(2) : '0.00'}</Typography>
                    </div>
                    <Typography className="stadium-about">{shop.description}</Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="section-header">
            <Typography variant="h5" sx={{ mt: 4, mb: 3 }}>Available Stadiums</Typography>
          </div>
          {stadiums.length === 0 ? (
            <div className="empty-message">
              <Typography variant="h6">No stadiums available.</Typography>
            </div>
          ) : (
            <div className="stadiums-grid">
              {stadiums.map((stadium) => (
                <Card className="stadium-card" key={stadium.id}>
                  <CardMedia
                    component="img"
                    className="stadium-image"
                    image={stadium.imageUrl || 'https://via.placeholder.com/300x200'}
                    alt={stadium.name}
                  />
                  <CardContent className="stadium-content">
                    <div className="stadium-header">
                      <Typography variant="h6" className="stadium-title">{stadium.name}</Typography>
                    </div>
                    <div className="stadium-info">
                      <Typography className="stadium-location"><span>📍</span>{stadium.location}</Typography>
                      <Typography className="stadium-capacity"><span>👥</span>{stadium.capacity.toLocaleString()} seats</Typography>
                    </div>
                    <Typography className="stadium-about">{stadium.about}</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddShop(stadium.id)}
                      className="add-button"
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      Add Shop
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={openAddDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>Add New Shop</DialogTitle>
            <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <TextField
                autoFocus
                margin="dense"
                label="Shop Name"
                fullWidth
                value={newShop.name}
                onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Location in Stadium"
                fullWidth
                value={newShop.location}
                onChange={(e) => setNewShop({ ...newShop, location: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Floor"
                fullWidth
                value={newShop.floor}
                onChange={(e) => setNewShop({ ...newShop, floor: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Gate Number"
                fullWidth
                value={newShop.gate}
                onChange={(e) => setNewShop({ ...newShop, gate: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={newShop.description}
                onChange={(e) => setNewShop({ ...newShop, description: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Delivery Fee"
                type="number"
                inputProps={{
                  min: "0",
                  step: "0.01"
                }}
                fullWidth
                value={newShop.deliveryFee}
                onChange={(e) => setNewShop({ ...newShop, deliveryFee: e.target.value })}
                helperText="Enter delivery fee amount (e.g., 5.00)"
              />

              {/* Inside Delivery Section */}
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
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
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
                      <TextField
                        margin="dense"
                        label="Currency"
                        select
                        fullWidth
                        value={newShop.insideDelivery?.currency || 'ILS'}
                        onChange={(e) => setNewShop({
                          ...newShop,
                          insideDelivery: { ...newShop.insideDelivery, currency: e.target.value }
                        })}
                      >
                        <MenuItem value="ILS">ILS (₪)</MenuItem>
                        <MenuItem value="USD">USD ($)</MenuItem>
                        <MenuItem value="EUR">EUR (€)</MenuItem>
                      </TextField>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    </div>

                    {/* Delivery Locations */}
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                        📍 Delivery Locations
                      </Typography>
                      {(newShop.insideDelivery?.locations || []).map((loc, idx) => (
                        <div key={idx} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'flex-start' }}>
                            <div>
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
                            </div>
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
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </div>
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
                    </div>
                  </div>
                )}
              </div>

              {/* Outside Delivery Section */}
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
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
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
                      <TextField
                        margin="dense"
                        label="Currency"
                        select
                        fullWidth
                        value={newShop.outsideDelivery?.currency || 'ILS'}
                        onChange={(e) => setNewShop({
                          ...newShop,
                          outsideDelivery: { ...newShop.outsideDelivery, currency: e.target.value }
                        })}
                      >
                        <MenuItem value="ILS">ILS (₪)</MenuItem>
                        <MenuItem value="USD">USD ($)</MenuItem>
                        <MenuItem value="EUR">EUR (€)</MenuItem>
                      </TextField>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    </div>

                    {/* Delivery Locations */}
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                        📍 Delivery Locations
                      </Typography>
                      {(newShop.outsideDelivery?.locations || []).map((loc, idx) => (
                        <div key={idx} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'flex-start' }}>
                            <div>
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
                            </div>
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
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </div>
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
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Picture Upload */}
              <div style={{ marginTop: '24px' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Shop Profile Picture
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {newShop.imagePreview ? 'Change Image' : 'Upload Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                {newShop.imagePreview && (
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <img 
                      src={newShop.imagePreview} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px', 
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }} 
                    />
                  </div>
                )}
              </div>
              {/* Manual Coordinate Input Fields */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <TextField
                  margin="dense"
                  label="Latitude *"
                  type="text"
                  inputProps={{
                    pattern: "[0-9.-]*",
                    inputMode: "decimal"
                  }}
                  fullWidth
                  required
                  value={newShop.latitude}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers, decimal point, and minus sign
                    if (/^-?\d*\.?\d*$/.test(value)) {
                      setNewShop({ ...newShop, latitude: value });
                    }
                  }}
                  placeholder="31.7683"
                  helperText="Enter latitude coordinate (required)"
                  error={!newShop.latitude && newShop.latitude !== ''}
                />
                <TextField
                  margin="dense"
                  label="Longitude *"
                  type="text"
                  inputProps={{
                    pattern: "[0-9.-]*",
                    inputMode: "decimal"
                  }}
                  fullWidth
                  required
                  value={newShop.longitude}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers, decimal point, and minus sign
                    if (/^-?\d*\.?\d*$/.test(value)) {
                      setNewShop({ ...newShop, longitude: value });
                    }
                  }}
                  placeholder="35.2137"
                  helperText="Enter longitude coordinate (required)"
                  error={!newShop.longitude && newShop.longitude !== ''}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                onClick={handleCreateShop}
                variant="contained"
                className="add-button"
                disabled={!newShop.name || !newShop.location || !newShop.floor || !newShop.gate || !newShop.latitude || !newShop.longitude || !newShop.deliveryFee}
              >
                Create Shop
              </Button>
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

          {/* Edit Shop Dialog */}
          <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
            <DialogTitle>Edit Shop</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Shop Name"
                fullWidth
                value={newShop.name}
                onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Location in Stadium"
                fullWidth
                value={newShop.location}
                onChange={(e) => setNewShop({ ...newShop, location: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Floor"
                fullWidth
                value={newShop.floor}
                onChange={(e) => setNewShop({ ...newShop, floor: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Gate Number"
                fullWidth
                value={newShop.gate}
                onChange={(e) => setNewShop({ ...newShop, gate: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={newShop.description}
                onChange={(e) => setNewShop({ ...newShop, description: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Delivery Fee"
                type="number"
                inputProps={{
                  min: "0",
                  step: "0.01"
                }}
                fullWidth
                value={newShop.deliveryFee}
                onChange={(e) => setNewShop({ ...newShop, deliveryFee: e.target.value })}
                helperText="Enter delivery fee amount (e.g., 5.00)"
              />

              {/* Inside Delivery Section */}
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
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
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
                      <TextField
                        margin="dense"
                        label="Currency"
                        select
                        fullWidth
                        value={newShop.insideDelivery?.currency || 'ILS'}
                        onChange={(e) => setNewShop({
                          ...newShop,
                          insideDelivery: { ...newShop.insideDelivery, currency: e.target.value }
                        })}
                      >
                        <MenuItem value="ILS">ILS (₪)</MenuItem>
                        <MenuItem value="USD">USD ($)</MenuItem>
                        <MenuItem value="EUR">EUR (€)</MenuItem>
                      </TextField>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    </div>

                    {/* Delivery Locations */}
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                        📍 Delivery Locations
                      </Typography>
                      {(newShop.insideDelivery?.locations || []).map((loc, idx) => (
                        <div key={idx} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'flex-start' }}>
                            <div>
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
                            </div>
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
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </div>
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
                    </div>
                  </div>
                )}
              </div>

              {/* Outside Delivery Section */}
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
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
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
                      <TextField
                        margin="dense"
                        label="Currency"
                        select
                        fullWidth
                        value={newShop.outsideDelivery?.currency || 'ILS'}
                        onChange={(e) => setNewShop({
                          ...newShop,
                          outsideDelivery: { ...newShop.outsideDelivery, currency: e.target.value }
                        })}
                      >
                        <MenuItem value="ILS">ILS (₪)</MenuItem>
                        <MenuItem value="USD">USD ($)</MenuItem>
                        <MenuItem value="EUR">EUR (€)</MenuItem>
                      </TextField>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    </div>

                    {/* Delivery Locations */}
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                        📍 Delivery Locations
                      </Typography>
                      {(newShop.outsideDelivery?.locations || []).map((loc, idx) => (
                        <div key={idx} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'flex-start' }}>
                            <div>
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
                            </div>
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
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </div>
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
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Picture Upload */}
              <div style={{ marginTop: '24px' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Shop Profile Picture
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {newShop.imagePreview ? 'Change Image' : 'Upload Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                {newShop.imagePreview && (
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <img 
                      src={newShop.imagePreview} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px', 
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }} 
                    />
                  </div>
                )}
              </div>
              {/* Manual Coordinate Input Fields */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <TextField
                  margin="dense"
                  label="Latitude *"
                  type="text"
                  inputProps={{
                    pattern: "[0-9.-]*",
                    inputMode: "decimal"
                  }}
                  fullWidth
                  required
                  value={newShop.latitude}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers, decimal point, and minus sign
                    if (/^-?\d*\.?\d*$/.test(value)) {
                      setNewShop({ ...newShop, latitude: value });
                    }
                  }}
                  placeholder="31.7683"
                  helperText="Enter latitude coordinate (required)"
                  error={!newShop.latitude && newShop.latitude !== ''}
                />
                <TextField
                  margin="dense"
                  label="Longitude *"
                  type="text"
                  inputProps={{
                    pattern: "[0-9.-]*",
                    inputMode: "decimal"
                  }}
                  fullWidth
                  required
                  value={newShop.longitude}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers, decimal point, and minus sign
                    if (/^-?\d*\.?\d*$/.test(value)) {
                      setNewShop({ ...newShop, longitude: value });
                    }
                  }}
                  placeholder="35.2137"
                  helperText="Enter longitude coordinate (required)"
                  error={!newShop.longitude && newShop.longitude !== ''}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditDialog}>Cancel</Button>
              <Button
                onClick={handleUpdateShop}
                variant="contained"
                className="add-button"
                disabled={!newShop.name || !newShop.location || !newShop.floor || !newShop.gate || !newShop.latitude || !newShop.longitude}
              >
                Update Shop
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default ShopPanel;
