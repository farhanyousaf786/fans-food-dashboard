import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { useStadium } from '../../context/StadiumContext';
import {
  collection,
  doc,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  where
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
  Box,
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
  IconButton,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const Menu = () => {
  const { shopId } = useParams();
  const { selectedShop } = useShop();
  const { selectedStadium } = useStadium();

  const [menuItems, setMenuItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
    categoryId: '',
    variants: [],
    addons: [],
    tags: [],
    createdAt: null
  });

  const [variantForm, setVariantForm] = useState({
    name: '',
    price: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [addonInput, setAddonInput] = useState('');

  const loadMenuItems = useCallback(async () => {
    if (!shopId || !selectedStadium) return;
    try {
      const stadiumRef = doc(db, 'stadiums', selectedStadium.id);
      const shopRef = doc(collection(stadiumRef, 'shops'), shopId);
      const menuItemsRef = collection(shopRef, 'menuItems');
      const menuItemsQuery = query(menuItemsRef);
      const querySnapshot = await getDocs(menuItemsQuery);
      const itemsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(itemsList);
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId, selectedStadium]);

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  const handleAddVariant = () => {
    if (!variantForm.name || !variantForm.price) return;
    setItemForm(prev => ({
      ...prev,
      variants: [...prev.variants, variantForm]
    }));
    setVariantForm({ name: '', price: '' });
  };

  const handleRemoveVariant = (index) => {
    setItemForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!shopId || !selectedStadium) return;
    try {
      let imageUrl = itemForm.imageUrl;
      if (imageFile) {
        const imageRef = ref(storage, `menuItems/${shopId}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const menuItemData = {
        ...itemForm,
        imageUrl,
        shopId,
        stadiumId: selectedStadium.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (selectedItem) {
        const stadiumRef = doc(db, 'stadiums', selectedStadium.id);
        const shopRef = doc(collection(stadiumRef, 'shops'), shopId);
        await updateDoc(doc(shopRef, 'menuItems', selectedItem.id), menuItemData);
      } else {
        const newItem = menuItemData;
        const stadiumRef = doc(db, 'stadiums', selectedStadium.id);
        const shopRef = doc(collection(stadiumRef, 'shops'), shopId);
        await addDoc(collection(shopRef, 'menuItems'), newItem);
      }

      handleCloseDialog();
      loadMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setImageFile(null);
    setImagePreview(null);
    setItemForm({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      isAvailable: true,
      categoryId: '',
      variants: [],
      addons: [],
      tags: []
    });
    setTagInput('');
    setAddonInput('');
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable ?? true,
      variants: item.variants || [],
      addons: item.addons || [],
      tags: item.tags || []
    });
    setImagePreview(item.imageUrl);
    setOpenDialog(true);
  };

  const handleDeleteItem = async (item) => {
    if (!shopId) return;
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        if (item.imageUrl) {
          const imageRef = ref(storage, item.imageUrl);
          await deleteObject(imageRef);
        }
        const stadiumRef = doc(db, 'stadiums', selectedStadium.id);
        const shopRef = doc(collection(stadiumRef, 'shops'), shopId);
        await deleteDoc(doc(shopRef, 'menuItems', item.id));
        loadMenuItems();
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 5 * 1024 * 1024) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {selectedShop?.name} - Menu Items
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Menu Item
          </Button>
        </Box>



      </Box>

      <Grid container spacing={3}>
        {menuItems.map(item => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}>
              {item.imageUrl && (
                <CardMedia
                  component="img"
                  height="200"
                  image={item.imageUrl}
                  alt={item.name}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {item.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoneyIcon color="primary" />
                  <Typography variant="h6" color="primary">
                    {item.price}
                  </Typography>
                </Box>
                {item.variants.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Variants:
                    </Typography>
                    {item.variants.map((variant, index) => (
                      <Chip
                        key={index}
                        label={`${variant.name} - $${variant.price}`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
                {item.tags.length > 0 && (
                  <Box>
                    {item.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        icon={<LocalOfferIcon />}
                        label={tag}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={item.isAvailable}
                      onChange={async (e) => {
                        await updateDoc(doc(db, 'menuItems', item.id), {
                          isAvailable: e.target.checked
                        });
                        loadMenuItems();
                      }}
                    />
                  }
                  label={item.isAvailable ? 'Available' : 'Unavailable'}
                />
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <IconButton
                  size="small"
                  onClick={() => handleEditItem(item)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteItem(item)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit Menu Item' : 'Add Menu Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
            <TextField
              label="Item Name"
              value={itemForm.name}
              onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Category"
                value={itemForm.categoryId}
                onChange={(e) => setItemForm(prev => ({ ...prev, categoryId: e.target.value }))}
                placeholder="e.g. burgers, drinks, snacks"
                fullWidth
                required
              />
            </Box>
            <TextField
              label="Description"
              value={itemForm.description}
              onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Price"
              type="number"
              value={itemForm.price}
              onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
              fullWidth
              required
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Add Tag"
                  size="small"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      setItemForm(prev => ({
                        ...prev,
                        tags: [...prev.tags, tagInput.trim()]
                      }));
                      setTagInput('');
                      e.preventDefault();
                    }
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {itemForm.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => {
                      setItemForm(prev => ({
                        ...prev,
                        tags: prev.tags.filter((_, i) => i !== index)
                      }));
                    }}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Addons
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Add Addon"
                  size="small"
                  value={addonInput}
                  onChange={(e) => setAddonInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && addonInput.trim()) {
                      setItemForm(prev => ({
                        ...prev,
                        addons: [...prev.addons, addonInput.trim()]
                      }));
                      setAddonInput('');
                      e.preventDefault();
                    }
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {itemForm.addons.map((addon, index) => (
                  <Chip
                    key={index}
                    label={addon}
                    onDelete={() => {
                      setItemForm(prev => ({
                        ...prev,
                        addons: prev.addons.filter((_, i) => i !== index)
                      }));
                    }}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Variants
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Variant Name"
                  size="small"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <TextField
                  label="Price"
                  type="number"
                  size="small"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, price: e.target.value }))}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddVariant}
                >
                  Add
                </Button>
              </Box>
              <List dense>
                {itemForm.variants.map((variant, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={variant.name}
                      secondary={`$${variant.price}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemoveVariant(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
            <Box>
              <input
                accept="image/*"
                type="file"
                id="menu-item-image"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="menu-item-image">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                >
                  Upload Image
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
          >
            {selectedItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Menu;
