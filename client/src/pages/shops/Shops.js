import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStadium } from '../../context/StadiumContext';
import { useShop } from '../../context/ShopContext';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const Shops = () => {
  const { selectedStadium } = useStadium();
  const { setSelectedShop: setGlobalSelectedShop } = useShop();
  const navigate = useNavigate();

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    imageUrl: '',
    isOpen: true
  });

  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedShop(null);
    setImageFile(null);
    setImagePreview(null);
    setFormData({
      name: '',
      description: '',
      location: '',
      imageUrl: '',
      isOpen: true
    });
  }, []);

  const loadShops = useCallback(async () => {
    if (!selectedStadium) return;
    try {
      const shopsRef = collection(db, 'stadiums', selectedStadium.id, 'shops');
      const shopsQuery = query(shopsRef);
      const querySnapshot = await getDocs(shopsQuery);
      const shopsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShops(shopsList);
    } catch (error) {
      console.error('Error loading shops:', error);
      showSnackbar('Error loading shops', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedStadium, showSnackbar]);

  useEffect(() => {
    if (!selectedStadium) {
      navigate('/stadiums');
      return;
    }
    loadShops();
  }, [selectedStadium, navigate, loadShops]);

  const handleSubmit = useCallback(async () => {
    if (!handleCloseDialog || !loadShops) return;
    if (!selectedStadium) return;
    if (!formData.name || !formData.location) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const imageRef = ref(storage, `shops/${selectedStadium.id}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const shopData = {
        ...formData,
        imageUrl,
        updatedAt: new Date().toISOString()
      };

      if (selectedShop) {
        await updateDoc(doc(db, 'stadiums', selectedStadium.id, 'shops', selectedShop.id), shopData);
        showSnackbar('Shop updated successfully', 'success');
      } else {
        const newShop = {
          ...shopData,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'stadiums', selectedStadium.id, 'shops'), newShop);
        showSnackbar('Shop added successfully', 'success');
      }

      handleCloseDialog();
      loadShops();
    } catch (error) {
      console.error('Error saving shop:', error);
      showSnackbar('Error saving shop', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedStadium, formData, imageFile, selectedShop, handleCloseDialog, loadShops, showSnackbar]);

  const handleDeleteShop = useCallback(async (shop) => {
    if (!loadShops) return;
    if (!selectedStadium) return;
    if (window.confirm('Are you sure you want to delete this shop?')) {
      setLoading(true);
      try {
        if (shop.imageUrl) {
          const imageRef = ref(storage, shop.imageUrl);
          await deleteObject(imageRef);
        }
        await deleteDoc(doc(db, 'stadiums', selectedStadium.id, 'shops', shop.id));
        showSnackbar('Shop deleted successfully', 'success');
        loadShops();
      } catch (error) {
        console.error('Error deleting shop:', error);
        showSnackbar('Error deleting shop', 'error');
      } finally {
        setLoading(false);
      }
    }
  }, [selectedStadium, showSnackbar, loadShops]);

  const handleEditShop = useCallback((shop) => {
    if (!setOpenDialog || !setSelectedShop || !setFormData || !setImagePreview) return;
    if (!shop) return;
    setSelectedShop(shop);
    setFormData({
      name: shop.name,
      description: shop.description || '',
      location: shop.location || '',
      imageUrl: shop.imageUrl || '',
      isOpen: shop.isOpen ?? true
    });
    setImagePreview(shop.imageUrl);
    setOpenDialog(true);
  }, []);



  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.size < 5 * 1024 * 1024) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      showSnackbar('Image size should be less than 5MB', 'error');
    }
  }, [showSnackbar]);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  if (!selectedStadium) {
    return (
      <Container>
        <Typography>Please select a stadium first</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {selectedStadium.name} - Shops
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Shop
        </Button>
      </Box>

      <Grid container spacing={4}>
        {shops.map(shop => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={shop.id}>
            <Card sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }
            }}>
              {shop.imageUrl && (
                <CardMedia
                  component="img"
                  height="180"
                  image={shop.imageUrl}
                  alt={shop.name}
                />
              )}
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 1,
                    color: 'primary.main'
                  }}
                >
                  {shop.name}
                </Typography>
                {shop.description && (
                  <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.5
                  }}
                >
                    {shop.description}
                  </Typography>
                )}
                <Typography 
                  variant="body2"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                    color: 'text.primary'
                  }}
                >
                  <LocationOnIcon fontSize="small" color="action" />
                  Location: {shop.location}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={shop.isOpen}
                      disabled
                    />
                  }
                  label={shop.isOpen ? 'Open' : 'Closed'}
                />
              </CardContent>
              <CardActions sx={{ 
                p: 2, 
                pt: 0,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => {
                    setGlobalSelectedShop(shop);
                    navigate(`/shops/${shop.id}/menu`);
                  }}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  View Menu
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={() => handleEditShop(shop)}
                    size="medium"
                    sx={{
                      backgroundColor: 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected'
                      }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteShop(shop)}
                    size="medium"
                    sx={{
                      backgroundColor: 'error.lighter',
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'error.dark'
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedShop ? 'Edit Shop' : 'Add New Shop'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
            <TextField
              label="Shop Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              fullWidth
              required
              placeholder="e.g., Gate 5, Level 2"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isOpen}
                  onChange={(e) => setFormData(prev => ({ ...prev, isOpen: e.target.checked }))}
                />
              }
              label="Shop is Open"
            />
            <input
              accept="image/*"
              type="file"
              id="shop-image"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="shop-image">
              <Button variant="outlined" component="span" fullWidth>
                {imageFile ? 'Change Image' : 'Upload Image'}
              </Button>
            </label>
            {imagePreview && (
              <Box
                component="img"
                src={imagePreview}
                alt="Preview"
                sx={{
                  mt: 2,
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: 1
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : selectedShop ? (
              'Save Changes'
            ) : (
              'Add Shop'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Shops;
