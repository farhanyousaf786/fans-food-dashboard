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
import './AddMenuDialog.css';

const categories = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks & Starters',
  'Drinks & Beverages',
  'Desserts',
  'Soups & Salads',
  'Fast Food',
  'Healthy Options',
  'Kids Menu',
  'Combos & Meal Deals'
];

const AddMenuDialog = ({ open, onClose, onSubmit, menuItem, onChange, shopData }) => {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!menuItem.foodType) {
      onChange({
        target: {
          name: 'foodType',
          value: { halal: false, kosher: false, vegan: false }
        }
      });
    }
  }, []);

  const handleImageUpload = (event) => {
    if (!event.target.files?.length) return;

    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    const currentImages = menuItem.images || [];
    onChange({ target: { name: 'images', value: [...currentImages, ...newImages] } });
  };

  const handleRemoveImage = (index) => {
    if (!menuItem.images) return;
    const newImages = [...menuItem.images];
    if (newImages[index]?.preview) {
      URL.revokeObjectURL(newImages[index].preview);
    }
    newImages.splice(index, 1);
    onChange({ target: { name: 'images', value: newImages } });
  };

  const handleAddOption = (type) => {
    const updated = { ...menuItem.customization };
    updated[type] = [...updated[type], { name: '', price: '' }];
    onChange({ target: { name: 'customization', value: updated } });
  };

  const handleRemoveOption = (type, index) => {
    const updated = { ...menuItem.customization };
    updated[type].splice(index, 1);
    onChange({ target: { name: 'customization', value: updated } });
  };

  const handleOptionChange = (type, index, field, value) => {
    const updated = { ...menuItem.customization };
    // Convert price to number
    if (field === 'price') {
      updated[type][index][field] = parseFloat(value) || 0;
    } else {
      updated[type][index][field] = value;
    }
    onChange({ target: { name: 'customization', value: updated } });
  };

  const handleSubmit = async () => {
    if (shopData?.stadiumId) {
      onChange({ target: { name: 'stadiumId', value: shopData.stadiumId } });
    }
    setLoading(true);
    try {
      await onSubmit();
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
            <TextField fullWidth label="Item Name" name="name" required value={menuItem.name} onChange={onChange} />
            <TextField fullWidth label="Price" name="price" type="number" required value={menuItem.price} onChange={onChange}
              InputProps={{ startAdornment: <span>$</span> }}
            />
            <TextField fullWidth multiline rows={3} label="Description" name="description"
              value={menuItem.description} onChange={onChange}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select name="category" value={menuItem.category} onChange={onChange} label="Category">
                {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>Available for Order</Typography>
              <Switch name="isAvailable" checked={menuItem.isAvailable} onChange={onChange} color="success" />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>Activate Offer</Typography>
              <Switch 
                name="offerActive" 
                checked={menuItem.offerActive || false} 
                onChange={(e) => onChange({ 
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
                onChange={onChange}
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
              value={menuItem.preparationTime} onChange={onChange}
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
                  onChange({ target: { name: 'allergens', value: newValue } });
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
                    onChange({
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
              {Object.entries(menuItem.customization).map(([type, options]) => (
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
                    {options.map((option, index) => (
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
                          value={option.name}
                          onChange={(e) => handleOptionChange(type, index, 'name', e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          label="Price"
                          type="number"
                          value={option.price}
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
                  {menuItem.images.map((img, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', p: 1, border: '1px solid #eee', borderRadius: '4px', bgcolor: '#fff' }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '4px', overflow: 'hidden', mr: 2, flexShrink: 0 }}>
                        <img src={img.preview} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                      <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.file.name}</Typography>
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
                        onChange={onChange}
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
