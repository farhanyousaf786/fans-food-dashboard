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
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../config/firebase';
import EditMenuDialog from './EditMenuDialog';
import './MenuList.css';

const MenuList = ({ shopData }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!shopData?.id) return;
    const menuItemsRef = collection(db, 'stadiums', shopData.stadiumId, 'shops', shopData.id, 'menuItems');
    const q = query(menuItemsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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

  const handleEdit = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
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

      const itemToUpdate = {
        ...updatedItem,
        images: imageUrls.length > 0 ? imageUrls : updatedItem.images || [],
        updatedAt: new Date().toISOString()
      };

      await updateDoc(menuItemRef, itemToUpdate);
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

      const menuItemRef = doc(db, 'stadiums', shopData.stadiumId, 'shops', shopData.id, 'menuItems', selectedItem.id);
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
            <Card sx={{ display: 'flex', height: 180, overflow: 'hidden' }}>
              <CardMedia
                component="img"
                image={item.images?.[0] || '/placeholder.jpg'}
                alt={item.name}
                sx={{ width: 180, height: 180, objectFit: 'cover' }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" className="menu-title" sx={{ fontSize: '1.1rem' }}>{item.name}</Typography>
                  <IconButton size="small" onClick={(e) => handleMenuClick(e, item)} className="more-button">
                    <MoreVert />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {item.description}
                </Typography>
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
    </Box>
  );
};

export default MenuList;
