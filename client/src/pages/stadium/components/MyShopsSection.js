import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../../config/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Tooltip,
  Grid,
  Button,
  Box
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import Shop from '../../../models/Shop';

const MyShopsSection = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [shopToDelete, setShopToDelete] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        // Get all shops from root collection (admin can see all)
        const shopsCollection = collection(db, 'shops');
        const shopsSnapshot = await getDocs(shopsCollection);
        const allShops = shopsSnapshot.docs.map(doc => {
          const rawData = doc.data();
          return Shop.fromFirestore(rawData, doc.id);
        });
        
        console.log('🏪 MY SHOPS SECTION: Total shops loaded:', allShops.length);
        setShops(allShops);
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

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
        description: editingShop.description
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
      <div className="section-header">
        <Typography variant="h5" sx={{ mt: 4, mb: 3 }}>All Shops</Typography>
      </div>
      
      {shops.length === 0 ? (
        <div className="empty-message">
          <Typography variant="h6">
            No shops found in the system.
          </Typography>
        </div>
      ) : (
        <div className="stadiums-grid">
          {shops.map((shop) => (
            <Card 
              className="stadium-card" 
              key={shop.id}
              sx={{ '&:hover': { transform: 'scale(1.02)', transition: 'transform 0.2s' } }}
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
                </div>
                <Typography className="stadium-about">{shop.description}</Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => navigate('/dashboard', { state: { shopData: shop } })}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Go to Shop
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
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
          />
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
    </>
  );
};

export default MyShopsSection;
