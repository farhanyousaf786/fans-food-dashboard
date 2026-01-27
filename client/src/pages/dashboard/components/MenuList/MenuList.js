import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Stack,
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
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  MoreVert,
  Edit,
  AccessTime,
  Circle,
  Warning
} from '@mui/icons-material';
import { collection, query, onSnapshot, doc, updateDoc, where, getDocs } from 'firebase/firestore';
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
    discountPercentage: 10,
    hasCOG: false,
    costOfGoods: 0
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
      ...item,
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
      discountPercentage: 10,
      hasCOG: !!item.hasCOG,
      costOfGoods: item.costOfGoods || 0
    });
    setEditDialogOpen(true);
  };


  const handleUpdateMenuItem = async (updatedItem) => {
    try {
      console.log('🔄 UPDATE: Starting update process...');

      if (!selectedItem?.id && !selectedItem?.docId) {
        throw new Error('Missing menu item ID');
      }

      if (!shopData?.stadiumId) {
        throw new Error('Missing stadium ID');
      }

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
        updatedItem.category,
        imageUrls.length > 0 ? imageUrls : updatedItem.images || [],
        updatedItem.isAvailable,
        parseInt(updatedItem.preparationTime),
        updatedItem.selectedShops || [],
        shopData.stadiumId,
        itemId,
        updatedItem.customization || { toppings: [], extras: [], sauces: [], sizes: [] },
        updatedItem.allergens || [],
        updatedItem.nutritionalInfo || {},
        updatedItem.foodType || { halal: false, kosher: false, vegan: false },
        updatedItem.currency || 'USD',
        updatedItem.isCombo || false,
        updatedItem.comboItemIds || [],
        updatedItem.hasCOG || false,
        updatedItem.costOfGoods ? parseFloat(updatedItem.costOfGoods) : 0
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

  const handleToggleAvailability = async (item, newValue) => {
    try {
      const itemId = item.docId || item.id;
      const menuItemRef = doc(db, 'menuItems', itemId);
      await updateDoc(menuItemRef, {
        isAvailable: newValue
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      setError("Failed to update availability status");
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

      <Stack spacing={2} className="menu-items-list">
        {menuItems
          .sort((a, b) => {
            if (a.isCombo && !b.isCombo) return -1;
            if (!a.isCombo && b.isCombo) return 1;
            return (a.name || '').localeCompare(b.name || '');
          })
          .map((item) => (
            <Box key={item.id} width="100%">
              <Card sx={{
                display: 'flex',
                p: { xs: 1.5, sm: 2 },
                gap: { xs: 1.5, sm: 2 },
                width: '100%',
                alignItems: 'flex-start',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'translateY(-1px)'
                }
              }}>
                {/* Left: Image Section */}
                <Box sx={{
                  display: { xs: 'none', sm: 'block' },
                  width: { xs: 80, sm: 100 },
                  height: { xs: 80, sm: 100 },
                  flexShrink: 0,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: '#f5f5f5',
                  position: 'relative',
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  {item.isCombo && item.images?.length > 1 ? (
                    <Box sx={{
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gridTemplateRows: '1fr 1fr',
                      gap: 0,
                    }}>
                      {item.images.slice(0, 4).map((img, index) => (
                        <Box
                          key={index}
                          sx={{
                            backgroundImage: `url(${img})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <CardMedia
                      component="img"
                      image={item.images?.[0] || '/placeholder.jpg'}
                      alt={item.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                </Box>

                {/* Right: Main Content (Header, Desc, Footer) */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>

                  {/* Row 1: Header (Name & Price/Action) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{
                        fontWeight: 700,
                        fontSize: { xs: '0.95rem', sm: '1.05rem' },
                        lineHeight: 1.2
                      }}>
                        {item.name?.split(' ').slice(0, 3).join(' ')}
                        {item.name?.split(' ').length > 3 ? '...' : ''}
                      </Typography>
                      {item.isCombo && (
                        <Chip
                          label="COMBO"
                          size="small"
                          color="success"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            borderRadius: '6px',
                            flexShrink: 0
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      <Typography variant="h6" color="primary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, fontWeight: 700 }}>
                        {item.currency === 'NIS' ? '₪' : '$'}{parseFloat(item.price).toFixed(2)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(item)}
                        sx={{ ml: 0.5, padding: '4px' }}
                      >
                        <Edit sx={{ fontSize: { xs: 16, sm: 18 } }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Row 2: Description */}
                  {item.description && (
                    <Typography variant="body2" color="text.secondary" sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      mb: 0.5
                    }}>
                      {item.description}
                    </Typography>
                  )}

                  {/* Row 3: Footer (Shops & Availability) */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', flexWrap: 'wrap', gap: 1 }}>

                    {/* Shops */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.shopIds && item.shopIds.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {getShopNames(item.shopIds).slice(0, 3).map((shopName, index) => (
                            <Chip
                              key={index}
                              label={shopName}
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: shopName === shopData?.name ? '#f0f7ff' : 'transparent',
                                borderColor: shopName === shopData?.name ? 'primary.main' : 'divider',
                                color: shopName === shopData?.name ? 'primary.main' : 'text.secondary'
                              }}
                            />
                          ))}
                          {getShopNames(item.shopIds).length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                              +{getShopNames(item.shopIds).length - 3} more
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>

                    {/* Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', gap: 0.5 }}>
                        <AccessTime sx={{ fontSize: 16 }} />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>{item.preparationTime} min</Typography>
                      </Box>

                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={item.isAvailable}
                            onChange={(e) => handleToggleAvailability(item, e.target.checked)}
                            color="success"
                            sx={{ transform: 'scale(0.8)' }}
                          />
                        }
                        label={item.isAvailable ? "Available" : "Unavailable"}
                        labelPlacement="start"
                        sx={{
                          margin: 0,
                          '& .MuiTypography-root': {
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: item.isAvailable ? 'success.main' : 'text.secondary'
                          }
                        }}
                      />
                    </Box>
                  </Box>

                </Box>
              </Card>
            </Box>
          ))}
      </Stack>

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
