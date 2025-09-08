// AddMenuDialog.jsx (Fixed: Food Type Logic)
import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Switch, Button, Box, Typography,
  IconButton, Stack, Divider, CircularProgress,
  Checkbox, FormGroup, FormControlLabel, Grid,
  Chip, Autocomplete
} from '@mui/material';
import {
  AccessTime, CloudUpload, Delete, Save,
  AddCircleOutline, RemoveCircleOutline
} from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import './AddMenuDialog.css';

// Categories will now be fetched from Firestore `categories` collection

const AddMenuDialog = ({ open, onClose, onSubmit, menuItem, onChange, setMenuItem, shopData, stadiumShops: propStadiumShops, isEditing = false }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [languages, setLanguages] = useState(['en', 'he']);
  const [newLangCode, setNewLangCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [stadiumShops, setStadiumShops] = useState(propStadiumShops || []);
  const fileInputRef = useRef(null);

  // Create a unified change handler that works with both interfaces
  const handleChange = (event) => {
    if (setMenuItem) {
      // New interface for editing mode
      const { name, value, checked, type } = event.target;
      
      // Handle nested object updates (like foodType.halal)
      if (name.includes('.')) {
        const [parentKey, childKey] = name.split('.');
        setMenuItem(prev => ({
          ...prev,
          [parentKey]: {
            ...prev[parentKey],
            [childKey]: type === 'checkbox' ? checked : value
          }
        }));
      } else {
        // Handle regular field updates
        const finalValue = type === 'checkbox' ? checked : value;
        setMenuItem(prev => ({
          ...prev,
          [name]: finalValue
        }));
      }
    } else if (onChange) {
      // Original interface
      onChange(event);
    }
  };

  useEffect(() => {
    if (!menuItem.foodType) {
      handleChange({
        target: {
          name: 'foodType',
          value: { halal: false, kosher: false, vegan: false }
        }
      });
    }
    // Initialize languages list from existing nameMap
    const nameKeys = Object.keys(menuItem?.nameMap || {});
    const descKeys = Object.keys(menuItem?.descriptionMap || {});
    const existing = Array.from(new Set([...nameKeys, ...descKeys]));
    if (existing.length > 0) {
      setLanguages(Array.from(new Set(['en', 'he', ...existing])));
    }
  }, []);

  // Fetch categories from Firestore when dialog opens
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const snap = await getDocs(collection(db, 'categories'));
        const list = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            icon: data.icon || '',
            nameEn: data?.nameMap?.en || '',
            nameHe: data?.nameMap?.he || ''
          };
        });
        // sort by English name
        list.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
        setCategories(list);
      } catch (err) {
        console.error('Error loading categories from Firestore:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Fetch all shops in the same stadium (only if not provided via props)
  useEffect(() => {
    const fetchStadiumShops = async () => {
      if (!shopData?.stadiumId || propStadiumShops?.length > 0) return;
      
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
        
        // Auto-select current shop if no shops are selected and not in editing mode
        if (!isEditing && (!menuItem.selectedShops || menuItem.selectedShops.length === 0)) {
          handleChange({
            target: {
              name: 'selectedShops',
              value: [shopData.id]
            }
          });
        }
      } catch (error) {
        console.error('Error fetching stadium shops:', error);
      }
    };

    if (open) {
      fetchStadiumShops();
    }
  }, [open, shopData?.stadiumId, shopData?.id, propStadiumShops, isEditing]);

  const handleShopSelection = (shopId) => {
    const currentSelection = menuItem.selectedShops || [];
    let newSelection;
    
    if (currentSelection.includes(shopId)) {
      // Remove shop from selection
      newSelection = currentSelection.filter(id => id !== shopId);
    } else {
      // Add shop to selection
      newSelection = [...currentSelection, shopId];
    }
    
    handleChange({
      target: {
        name: 'selectedShops',
        value: newSelection
      }
    });
  };

  const handleImageUpload = (event) => {
    if (!event.target.files?.length) return;

    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    const currentImages = menuItem.images || [];
    handleChange({ target: { name: 'images', value: [...currentImages, ...newImages] } });
  };

  const handleRemoveImage = (index) => {
    if (!menuItem.images) return;
    const newImages = [...menuItem.images];
    if (newImages[index]?.preview) {
      URL.revokeObjectURL(newImages[index].preview);
    }
    newImages.splice(index, 1);
    handleChange({ target: { name: 'images', value: newImages } });
  };

  const handleAddOption = (type) => {
    const updated = { ...menuItem.customization };
    updated[type] = [...updated[type], { name: '', price: '' }];
    handleChange({ target: { name: 'customization', value: updated } });
  };

  const handleRemoveOption = (type, index) => {
    const updated = { ...menuItem.customization };
    updated[type].splice(index, 1);
    handleChange({ target: { name: 'customization', value: updated } });
  };

  const handleOptionChange = (type, index, field, value) => {
    const updated = { ...menuItem.customization };
    // Convert price to number
    if (field === 'price') {
      updated[type][index][field] = parseFloat(value) || 0;
    } else {
      updated[type][index][field] = value;
    }
    handleChange({ target: { name: 'customization', value: updated } });
  };

  const handleSubmit = async () => {
    if (shopData?.stadiumId) {
      handleChange({ target: { name: 'stadiumId', value: shopData.stadiumId } });
    }
    setLoading(true);
    try {
      // Ensure backward compatibility: set flat name from English if present
      const toSubmit = {
        ...menuItem,
        name: (menuItem?.nameMap && menuItem.nameMap.en) ? menuItem.nameMap.en : (menuItem.name || ''),
        description: (menuItem?.descriptionMap && menuItem.descriptionMap.en)
          ? menuItem.descriptionMap.en
          : (menuItem.description || '')
      };
      // Pass the data to the onSubmit function
      await onSubmit(toSubmit);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving menu item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper"
      PaperProps={{ sx: { maxHeight: '90vh', height: '90vh', display: 'flex', flexDirection: 'column' } }}
    >
      <Box className="modern-dialog" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DialogTitle className="modern-header">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h5">Add New Menu Item</Typography>
              <Typography variant="body2" className="subtitle">
                Complete the form to add your new item
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
              onClick={handleSubmit}
              className="modern-submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Menu Item'}
            </Button>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent className="modern-content" sx={{ overflowY: 'auto', flexGrow: 1, pb: 3 }}>
          <Stack spacing={3}>
            {/* Multilingual Item Names */}
            <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                Item Names (Multilingual)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Provide the item name in one or more languages. English (en) and Hebrew (he) shown by default.
              </Typography>
              <Stack spacing={2}>
                {languages.map((code) => (
                  <Box key={code} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      label={`Name (${code.toUpperCase()})`}
                      name={`nameMap.${code}`}
                      value={menuItem?.nameMap?.[code] || ''}
                      onChange={handleChange}
                    />
                    {code !== 'en' && code !== 'he' && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          // remove language from list and clear its value
                          setLanguages((prev) => prev.filter((c) => c !== code));
                          const nm = { ...(menuItem.nameMap || {}) };
                          delete nm[code];
                          handleChange({ target: { name: 'nameMap', value: nm } });
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                ))}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    label="Add language code (e.g., ar, fr)"
                    value={newLangCode}
                    onChange={(e) => setNewLangCode(e.target.value.toLowerCase())}
                    sx={{ maxWidth: 260 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const code = (newLangCode || '').trim().toLowerCase();
                      if (!code) return;
                      if (!/^[a-z]{2,5}(-[a-z]{2})?$/i.test(code)) return; // basic code validation
                      if (!languages.includes(code)) {
                        setLanguages((prev) => [...prev, code]);
                        // seed empty value for new language
                        const nm = { ...(menuItem.nameMap || {}) };
                        nm[code] = '';
                        handleChange({ target: { name: 'nameMap', value: nm } });
                      }
                      setNewLangCode('');
                    }}
                  >
                    Add Language
                  </Button>
                </Box>
              </Stack>
            </Box>
            
            {/* Price with Currency Selection */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField 
                label="Price" 
                name="price" 
                type="number" 
                required 
                value={menuItem.price} 
                onChange={handleChange}
                sx={{ flex: 1 }}
                InputProps={{ 
                  startAdornment: <span>{menuItem.currency === 'NIS' ? '₪' : '$'}</span> 
                }}
              />
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Currency</InputLabel>
                <Select 
                  name="currency" 
                  value={menuItem.currency || 'USD'} 
                  onChange={handleChange} 
                  label="Currency"
                >
                  <MenuItem value="USD">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>$</span>
                      <span>USD</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="NIS">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>₪</span>
                      <span>NIS</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            {/* Multilingual Descriptions */}
            <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                Descriptions (Multilingual)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Provide the item description in one or more languages.
              </Typography>
              <Stack spacing={2}>
                {languages.map((code) => (
                  <TextField
                    key={code}
                    fullWidth
                    multiline
                    rows={3}
                    label={`Description (${code.toUpperCase()})`}
                    name={`descriptionMap.${code}`}
                    value={menuItem?.descriptionMap?.[code] || ''}
                    onChange={handleChange}
                  />
                ))}
              </Stack>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select name="category" value={menuItem.category || ''} onChange={handleChange} label="Category">
                {categoriesLoading && (
                  <MenuItem value="" disabled>Loading categories...</MenuItem>
                )}
                {!categoriesLoading && categories.length === 0 && (
                  <MenuItem value="" disabled>No categories found</MenuItem>
                )}
                {!categoriesLoading && categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{cat.icon}</span>
                      <span>{cat.nameEn}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Shop Selection Section */}
            <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                Available in Shops
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which shops in {shopData?.stadiumName || 'this stadium'} will offer this menu item
              </Typography>
              
              {stadiumShops.length > 0 ? (
                <Grid container spacing={1}>
                  {stadiumShops.filter(shop => shop && shop.id && shop.name).map((shop) => (
                    <Grid item xs={12} sm={6} md={4} key={shop.id}>
                      <Box
                        sx={{
                          border: '1px solid',
                          borderColor: (menuItem.selectedShops || []).includes(shop.id) ? '#3D70FF' : '#ddd',
                          borderRadius: '8px',
                          p: 2,
                          cursor: 'pointer',
                          bgcolor: (menuItem.selectedShops || []).includes(shop.id) ? '#f0f4ff' : '#fff',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#3D70FF',
                            bgcolor: '#f0f4ff'
                          }
                        }}
                        onClick={() => handleShopSelection(shop.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Checkbox
                            checked={(menuItem.selectedShops || []).includes(shop.id)}
                            onChange={() => handleShopSelection(shop.id)}
                            sx={{ p: 0, mr: 1 }}
                            color="primary"
                          />
                          <Typography variant="subtitle2" fontWeight="500">
                            {shop.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          📍 {shop.location || 'Location not specified'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          🚪 Gate {shop.gate || 'N/A'}, Floor {shop.floor || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography color="text.secondary">Loading shops...</Typography>
                </Box>
              )}
              
              {menuItem.selectedShops && menuItem.selectedShops.length > 0 && (
                <Box sx={{ mt: 2, p: 1, bgcolor: '#e8f5e8', borderRadius: '4px' }}>
                  <Typography variant="body2" color="success.main">
                    ✅ Selected {menuItem.selectedShops.length} shop{menuItem.selectedShops.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>Available for Order</Typography>
              <Switch name="isAvailable" checked={menuItem.isAvailable} onChange={handleChange} color="success" />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>Activate Offer</Typography>
              <Switch 
                name="offerActive" 
                checked={menuItem.offerActive || false} 
                onChange={(e) => handleChange({ 
                  target: { 
                    name: 'offerActive', 
                    value: e.target.checked 
                  } 
                })} 
                color="secondary" 
              />
            </Box>

            {menuItem.offerActive && (
              <TextField
                fullWidth
                label="Discount Percentage"
                name="discountPercentage"
                type="number"
                value={menuItem.discountPercentage}
                onChange={handleChange}
                InputProps={{
                  endAdornment: <Typography sx={{ color: '#888' }}>%</Typography>,
                  inputProps: { 
                    min: 0, 
                    max: 100,
                    step: 0.1 // Allows decimal numbers with one decimal place
                  }
                }}
              />
            )}

            <TextField fullWidth label="Preparation Time (min)" name="preparationTime" type="number"
              value={menuItem.preparationTime} onChange={handleChange}
              InputProps={{ endAdornment: <AccessTime sx={{ color: '#888' }} /> }}
            />

            {/* Allergens Section */}
            <Box sx={{ mt: 3, border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>Allergens</Typography>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={menuItem.allergens || []}
                onChange={(event, newValue) => {
                  handleChange({ target: { name: 'allergens', value: newValue } });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Type allergen and press Enter"
                    helperText="Type any allergen and press Enter to add it"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      color="warning"
                      variant="outlined"
                    />
                  ))
                }
              />
            </Box>

            {/* Nutritional Information */}
            <Box sx={{ mt: 3, border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>Nutritional Information</Typography>
              <Box sx={{ mb: 1 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={Object.entries(menuItem.nutritionalInfo || {}).map(([key, value]) => `${key}: ${value}`)}
                  onChange={(event, newValue) => {
                    const nutritionalInfo = {};
                    newValue.forEach(item => {
                      const [key, value] = item.split(':').map(s => s.trim());
                      if (key && value) {
                        nutritionalInfo[key.toLowerCase()] = value;
                      }
                    });
                    handleChange({
                      target: {
                        name: 'nutritionalInfo',
                        value: nutritionalInfo
                      }
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      placeholder="Type info like 'Calories: 500' and press Enter"
                      helperText="Format: Name: Value (e.g., 'Protein: 20g')"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        color="info"
                        variant="outlined"
                      />
                    ))
                  }
                />
              </Box>
            </Box>

            {/* Customization Options */}
            <Box sx={{ mt: 3, border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>Customization Options</Typography>
              {Object.entries(menuItem.customization || {}).map(([type, options]) => (
                <Box key={type} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>{type}</Typography>
                    <Button
                      size="small"
                      startIcon={<AddCircleOutline />}
                      onClick={() => handleAddOption(type)}
                    >
                      Add {type.slice(0, -1)}
                    </Button>
                  </Box>
                  <Stack spacing={2}>
                    {(options || []).filter(option => option && typeof option === 'object').map((option, index) => (
                      <Box key={index} sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        p: 1,
                        border: '1px solid #eee',
                        borderRadius: '4px'
                      }}>
                        <TextField
                          size="small"
                          label="Name"
                          value={option.name || ''}
                          onChange={(e) => handleOptionChange(type, index, 'name', e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          label="Price"
                          type="number"
                          value={option.price || ''}
                          onChange={(e) => handleOptionChange(type, index, 'price', e.target.value)}
                          sx={{ width: '100px' }}
                          InputProps={{
                            startAdornment: <Typography>$</Typography>
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveOption(type, index)}
                          color="error"
                        >
                          <RemoveCircleOutline />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Box>

            {/* Image Upload Section */}
            <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="500">Menu Images</Typography>
                <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => fileInputRef.current?.click()} size="small">
                  Upload Images
                </Button>
              </Box>
              <input type="file" multiple accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
              {(!menuItem.images || menuItem.images.length === 0) ? (
                <Box sx={{ border: '2px dashed #ddd', borderRadius: '8px', p: 3, textAlign: 'center', bgcolor: '#fafafa' }}>
                  <Typography color="text.secondary">No images selected yet</Typography>
                </Box>
              ) : (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {(menuItem.images || []).map((img, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', p: 1, border: '1px solid #eee', borderRadius: '4px', bgcolor: '#fff' }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '4px', overflow: 'hidden', mr: 2, flexShrink: 0 }}>
                        <img src={img.preview || img} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                      <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.file?.name || `Image ${idx + 1}`}</Typography>
                      <IconButton size="small" onClick={() => handleRemoveImage(idx)} sx={{ color: '#666' }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            {/* ✅ Food Type Checkboxes Only */}
            <Box sx={{ mt: 3, border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>Food Type</Typography>
              <FormGroup row>
                {["halal", "kosher", "vegan"].map((key) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        name={`foodType.${key}`}
                        checked={menuItem.foodType?.[key] === true}
                        onChange={handleChange}
                      />
                    }
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                  />
                ))}
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, borderTop: '1px solid #ddd' }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default AddMenuDialog;
