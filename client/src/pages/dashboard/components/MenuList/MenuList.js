import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  AccessTime,
  Circle,
  Warning
} from '@mui/icons-material';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, where, getDocs } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../config/firebase';
import MenuItemModel from '../../../../models/MenuItem';
import AddMenuDialog from '../AddMenuDialod/AddMenuDialog';
import './MenuList.css';

const MenuList = ({ shopData }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [readMoreDialogOpen, setReadMoreDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stadiumShops, setStadiumShops] = useState([]);
  const [editMenuItem, setEditMenuItem] = useState({
    name: "",
    nameMap: { en: '', he: '' },
    description: "",
    descriptionMap: { en: '', he: '' },
    price: "",
    category: "",
    images: [],
    isAvailable: true,
    preparationTime: 15,
    selectedShops: [],
    customization: {
      toppings: [],
      extras: [],
      sauces: [],
      sizes: [],
    },
    allergens: [],
    nutritionalInfo: {},
    foodType: {
      halal: false,
      kosher: false,
      vegan: false
    },
    currency: 'USD',
    offerActive: false,
    discountPercentage: 10
  });

  useEffect(() => {
    if (!shopData?.id) return;
    const menuItemsRef = collection(db, 'menuItems');
    // Query for menu items that include this shop in their shopIds array
    const q = query(menuItemsRef, where('shopIds', 'array-contains', shopData.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => 
        MenuItemModel.fromFirestore(doc.data(), doc.id)
      );
      setMenuItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shopData]);

  // Fetch all shops in the stadium for display purposes
  useEffect(() => {
    const fetchStadiumShops = async () => {
      if (!shopData?.stadiumId) return;
      
      try {
        const shopsRef = collection(db, 'shops');
        const q = query(shopsRef, where('stadiumId', '==', shopData.stadiumId));
        const querySnapshot = await getDocs(q);
        
        const shops = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          location: doc.data().location,
          floor: doc.data().floor,
          gate: doc.data().gate
        }));
        
        setStadiumShops(shops);
      } catch (error) {
        console.error('Error fetching stadium shops:', error);
      }
    };

    fetchStadiumShops();
  }, [shopData?.stadiumId]);

  // Helper function to get shop names from shop IDs
  const getShopNames = (shopIds) => {
    if (!shopIds || !Array.isArray(shopIds) || stadiumShops.length === 0) {
      return [];
    }
    
    return shopIds.map(shopId => {
      const shop = stadiumShops.find(s => s.id === shopId);
      return shop ? shop.name : `Shop ${shopId.slice(-4)}`;
    }).filter(Boolean);
  };

  const handleMenuClick = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    // Populate editMenuItem with the selected item's data
    setEditMenuItem({
      name: item.name || "",
      nameMap: item.nameMap || { en: item.name || '' },
      description: item.description || "",
      descriptionMap: item.descriptionMap || {},
      price: item.price?.toString() || "",
      category: item.category || "",
      images: item.images || [],
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      preparationTime: item.preparationTime || 15,
      selectedShops: item.shopIds || [],
      customization: item.customization || {
        toppings: [],
        extras: [],
        sauces: [],
        sizes: [],
      },
      allergens: item.allergens || [],
      nutritionalInfo: item.nutritionalInfo || {},
      foodType: item.foodType || {
        halal: false,
        kosher: false,
        vegan: false
      },
      currency: item.currency || 'USD',
      offerActive: false,
      discountPercentage: 10
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleUpdateMenuItem = async (updatedItem) => {
    try {
      console.log('🔄 UPDATE: Starting update process...');
      console.log('🔄 UPDATE: selectedItem:', selectedItem);
      console.log('🔄 UPDATE: shopData:', shopData);
      console.log('🔄 UPDATE: updatedItem:', updatedItem);
      
      if (!selectedItem?.id && !selectedItem?.docId) {
        console.error('🔄 UPDATE: Missing selectedItem id/docId');
        throw new Error('Missing menu item ID');
      }
      
      if (!shopData?.stadiumId) {
        console.error('🔄 UPDATE: Missing shopData stadiumId');
        throw new Error('Missing stadium ID');
      }

      // Use either docId or id for the document reference
      const itemId = selectedItem.docId || selectedItem.id;
      const menuItemRef = doc(db, 'menuItems', itemId);

      const imageUrls = [];
      if (updatedItem.images?.length > 0) {
        for (const image of updatedItem.images) {
          if (typeof image === 'string') {
            imageUrls.push(image);
          } else if (image.file) {
            const storageRef = ref(storage, `menuItems/${shopData.id}/${Date.now()}-${image.file.name}`);
            const snapshot = await uploadBytes(storageRef, image.file);
            const url = await getDownloadURL(snapshot.ref);
            imageUrls.push(url);
          }
        }
      }

      const flatName = (updatedItem?.nameMap && updatedItem.nameMap.en) ? updatedItem.nameMap.en : (updatedItem.name || '');
      const flatDescription = (updatedItem?.descriptionMap && updatedItem.descriptionMap.en) ? updatedItem.descriptionMap.en : (updatedItem.description || '');
      const menuItem = new MenuItemModel(
        flatName,
        updatedItem.nameMap || {},
        flatDescription,
        updatedItem.descriptionMap || {},
        parseFloat(updatedItem.price),
        updatedItem.category, // categoryId
        imageUrls.length > 0 ? imageUrls : updatedItem.images || [],
        updatedItem.isAvailable,
        parseInt(updatedItem.preparationTime),
        updatedItem.selectedShops || [], // Use selectedShops array for multi-shop support
        shopData.stadiumId,
        itemId,
        updatedItem.customization || {
          toppings: [],
          extras: [],
          sauces: [],
          sizes: []
        },
        updatedItem.allergens || [],
        updatedItem.nutritionalInfo || {},
        updatedItem.foodType || {
          halal: false,
          kosher: false,
          vegan: false
        },
        updatedItem.currency || 'USD'
      );

      await updateDoc(menuItemRef, menuItem.toFirestore());
      setSuccess('Menu item updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setEditDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating menu item:', error);
      setError(error.message || 'Failed to update menu item');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      console.log('🗑️ DELETE: Starting delete process...');
      console.log('🗑️ DELETE: Selected item:', selectedItem);
      console.log('🗑️ DELETE: Shop data:', shopData);
      
      // Check if we have the required data
      if (!selectedItem?.id && !selectedItem?.docId) {
        console.error('🗑️ DELETE: Missing selectedItem id/docId');
        throw new Error('Missing menu item ID');
      }
      
      if (!shopData?.id) {
        console.error('🗑️ DELETE: Missing shopData id');
        throw new Error('Missing shop data');
      }

      // Use either docId or id for the document reference
      const itemId = selectedItem.docId || selectedItem.id;
      console.log('🗑️ DELETE: Using item ID:', itemId);

      // Delete associated images from storage
      if (selectedItem.images?.length > 0) {
        console.log('🗑️ DELETE: Deleting images...');
        for (const imageUrl of selectedItem.images) {
          if (imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
            try {
              const imageRef = ref(storage, imageUrl);
              await deleteObject(imageRef);
              console.log('🗑️ DELETE: Image deleted:', imageUrl);
            } catch (imageError) {
              console.warn('🗑️ DELETE: Failed to delete image:', imageUrl, imageError);
            }
          }
        }
      }

      // Delete the menu item document from the root menuItems collection
      const menuItemRef = doc(db, 'menuItems', itemId);
      await deleteDoc(menuItemRef);
      
      console.log('✅ DELETE: Menu item deleted successfully');
      setSuccess('Menu item deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      handleMenuClose();
    } catch (error) {
      console.error('❌ DELETE: Error deleting menu item:', error);
      setError(error.message || 'Failed to delete menu item');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item}>
            <Card>
              <Skeleton variant="rectangular" height={200} />
              <CardContent>
                <Skeleton width="60%" />
                <Skeleton width="40%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (menuItems.length === 0) {
    return (
      <Box className="empty-state">
        <Typography variant="h6" color="text.secondary">
          No Menu Items Yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click the "Add Menu Item" button above to start creating your menu.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card sx={{ display: 'flex', height: 180, overflow: 'hidden' }}>
              <CardMedia
                component="img"
                image={item.images?.[0] || '/placeholder.jpg'}
                alt={item.name}
                sx={{ width: 140, height: 180, objectFit: 'cover' }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                      {item.name}
                    </Typography>
                    {item.description && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.description.split(' ').slice(0, 5).join(' ')}
                          {item.description.split(' ').length > 5 ? '...' : ''}
                        </Typography>
                        <Button 
                          size="small" 
                          sx={{ minWidth: 'auto', p: 0, color: 'primary.main', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedItem(item);
                            setReadMoreDialogOpen(true);
                          }}
                        >
                          Read More
                        </Button>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleEdit(item)} sx={{ padding: '4px' }}>
                      <Edit sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item)} sx={{ padding: '4px', color: 'error.main' }}>
                      <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Shop Availability Section */}
                {item.shopIds && item.shopIds.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.5, display: 'block' }}>
                      Available in:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {getShopNames(item.shopIds).slice(0, 2).map((shopName, index) => (
                        <Chip
                          key={index}
                          label={shopName}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem',
                            bgcolor: shopName === shopData?.name ? '#e3f2fd' : 'transparent',
                            borderColor: shopName === shopData?.name ? '#2196f3' : '#ddd',
                            color: shopName === shopData?.name ? '#1976d2' : 'text.secondary'
                          }}
                        />
                      ))}
                      {getShopNames(item.shopIds).length > 2 && (
                        <Chip
                          label={`+${getShopNames(item.shopIds).length - 2} more`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem',
                            color: 'text.secondary',
                            borderColor: '#ddd'
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
               
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="primary" sx={{ fontSize: '1.1rem' }}>
                    {item.currency === 'NIS' ? '₪' : '$'}{parseFloat(item.price).toFixed(2)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip
                      icon={<Circle sx={{ fontSize: 10 }} />}
                      label={item.isAvailable ? 'Available' : 'Unavailable'}
                      color={item.isAvailable ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                      sx={{ height: 24 }}
                    />
                    <Chip
                      icon={<AccessTime sx={{ fontSize: 10 }} />}
                      label={`${item.preparationTime} min`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 24 }}
                    />
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}><Edit sx={{ mr: 1, fontSize: 20 }} />Edit Item</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}><Delete sx={{ mr: 1, fontSize: 20 }} />Delete Item</MenuItem>
      </Menu>

      <AddMenuDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedItem(null);
        }}
        onSubmit={handleUpdateMenuItem}
        menuItem={editMenuItem}
        setMenuItem={setEditMenuItem}
        shopData={shopData}
        stadiumShops={stadiumShops}
        isEditing={true}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Read More Dialog */}
      <Dialog 
        open={readMoreDialogOpen} 
        onClose={() => setReadMoreDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>{selectedItem?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
            <Typography>{selectedItem?.description}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Price Details</Typography>
            <Typography>Price: {selectedItem?.currency === 'NIS' ? '₪' : '$'}{(selectedItem?.price || 0).toFixed(2)}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Additional Information</Typography>
            <Typography>Category: {selectedItem?.category}</Typography>
            <Typography>Preparation Time: {selectedItem?.preparationTime} minutes</Typography>
            <Typography>Status: {selectedItem?.isAvailable ? 'Available' : 'Unavailable'}</Typography>
          </Box>

          {/* Food Type Information */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Food Type</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip
                label="Halal"
                color={selectedItem?.foodType?.halal ? 'success' : 'default'}
                variant={selectedItem?.foodType?.halal ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="Kosher"
                color={selectedItem?.foodType?.kosher ? 'success' : 'default'}
                variant={selectedItem?.foodType?.kosher ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="Vegan"
                color={selectedItem?.foodType?.vegan ? 'success' : 'default'}
                variant={selectedItem?.foodType?.vegan ? 'filled' : 'outlined'}
                size="small"
              />
            </Box>
          </Box>

          {/* Allergens */}
          {selectedItem?.allergens?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Allergens</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedItem.allergens.map((allergen, idx) => (
                  <Chip
                    key={idx}
                    label={allergen}
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Nutritional Information */}
          {Object.keys(selectedItem?.nutritionalInfo || {}).length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Nutritional Information</Typography>
              <Grid container spacing={2}>
                {Object.entries(selectedItem.nutritionalInfo).map(([key, value]) => (
                  <Grid item xs={6} sm={4} key={key}>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {key}: {value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Customization Options */}
          {selectedItem?.customization && Object.keys(selectedItem.customization).length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Customization Options</Typography>
              <Grid container spacing={2}>
                {Object.entries(selectedItem.customization).map(([type, options]) => (
                  <Grid item xs={12} sm={6} key={type}>
                    <Typography variant="body2" sx={{ 
                      textTransform: 'capitalize',
                      fontWeight: 'bold',
                      mb: 1
                    }}>{type}</Typography>
                    {options.map((option, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">{option.name}</Typography>
                        <Typography variant="body2" color="primary">
                          ${typeof option.price === 'number' ? option.price.toFixed(2) : parseFloat(option.price || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Grid>
                ))}
              </Grid>
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

export default MenuList;
