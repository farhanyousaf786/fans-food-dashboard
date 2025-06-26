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
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../config/firebase';
import MenuItemModel from '../../../../models/MenuItem';
import EditMenuDialog from './EditMenuDialog';
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

  useEffect(() => {
    if (!shopData?.id) return;
    const menuItemsRef = collection(db, 'menuItems');
    const q = query(menuItemsRef, where('shopId', '==', shopData.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => 
        MenuItemModel.fromFirestore(doc.data(), doc.id)
      );
      setMenuItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shopData]);

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
    setEditDialogOpen(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleUpdateMenuItem = async (updatedItem) => {
    try {
      if (!selectedItem?.id || !shopData?.id || !shopData?.stadiumId) {
        throw new Error('Missing required data');
      }

      const menuItemRef = doc(db, 'stadiums', shopData.stadiumId, 'shops', shopData.id, 'menuItems', selectedItem.id);

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

      const menuItem = new MenuItemModel(
        updatedItem.name,
        updatedItem.description,
        updatedItem.price,
        updatedItem.category,
        imageUrls.length > 0 ? imageUrls : updatedItem.images || [],
        updatedItem.isAvailable,
        updatedItem.preparationTime,
        shopData.id,
        shopData.stadiumId,
        selectedItem.docId
      );
      menuItem.customization = updatedItem.customization;
      menuItem.allergens = updatedItem.allergens;
      menuItem.nutritionalInfo = updatedItem.nutritionalInfo;
      menuItem.foodType = updatedItem.foodType;

      await updateDoc(menuItemRef, menuItem.toFirestore());
      setSuccess('Menu item updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating menu item:', error);
      setError(error.message || 'Failed to update menu item');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedItem?.id || !shopData?.id || !shopData?.stadiumId) {
        throw new Error('Missing required data');
      }

      if (selectedItem.images?.length > 0) {
        for (const imageUrl of selectedItem.images) {
          if (imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          }
        }
      }

      const menuItemRef = doc(db, 'menuItems', selectedItem.docId);
      await deleteDoc(menuItemRef);
      setSuccess('Menu item deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting menu item:', error);
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
            <Card sx={{ display: 'flex', height: 220, overflow: 'hidden' }}>
              <CardMedia
                component="img"
                image={item.images?.[0] || '/placeholder.jpg'}
                alt={item.name}
                sx={{ width: 220, height: 220, objectFit: 'cover' }}
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
               
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="primary" sx={{ fontSize: '1.1rem' }}>${parseFloat(item.price).toFixed(2)}</Typography>
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

      <EditMenuDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleUpdateMenuItem}
        menuItem={selectedItem}
        shopData={shopData}
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
            <Typography>Price: ${(selectedItem?.price || 0).toFixed(2)}</Typography>
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
