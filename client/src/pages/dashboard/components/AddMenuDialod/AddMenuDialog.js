// AddMenuDialog.jsx (Modern Revamp - One Field Per Line)
import React, { useRef, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Select, MenuItem, FormControl, InputLabel,
    Switch, Button, Grid, Box, Typography,
    IconButton, Stack, Divider, CircularProgress,
    Snackbar, Alert
} from '@mui/material';
import { AccessTime, CloudUpload, Delete, Save, CheckCircle, Add, Restaurant, AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import './AddMenuDialog.css';

const categories = [
    'Appetizers', 'Main Course', 'Sides', 'Beverages', 'Desserts', 'Specials'
];

const AddMenuDialog = ({ open, onClose, onSubmit, menuItem, onChange }) => {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageUpload = (event) => {
        if (!event.target.files?.length) return;
        
        const files = Array.from(event.target.files);
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        // Ensure we have an array to spread into
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
        const updatedCustomization = { ...menuItem.customization };
        updatedCustomization[type] = [
            ...updatedCustomization[type],
            { name: '', price: '' }
        ];
        onChange({ target: { name: 'customization', value: updatedCustomization } });
    };

    const handleRemoveOption = (type, index) => {
        const updatedCustomization = { ...menuItem.customization };
        updatedCustomization[type].splice(index, 1);
        onChange({ target: { name: 'customization', value: updatedCustomization } });
    };

    const handleOptionChange = (type, index, field, value) => {
        const updatedCustomization = { ...menuItem.customization };
        updatedCustomization[type][index][field] = value;
        onChange({ target: { name: 'customization', value: updatedCustomization } });
    };

    const handleSubmit = async () => {
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
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth 
            scroll="paper"
            PaperProps={{
                sx: {
                    maxHeight: '90vh',
                    height: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            <Box className="modern-dialog" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <DialogTitle className="modern-header">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography variant="h5">Add New Menu Item</Typography>
                            <Typography variant="body2" className="subtitle">Complete the form to add your new item</Typography>
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
                    <Stack spacing={3} sx={{ minHeight: 'min-content' }}>
                            {/* Basic Information */}
                        <TextField
                            fullWidth
                            label="Item Name"
                            name="name"
                            required
                            value={menuItem.name}
                            onChange={onChange}
                            className="modern-input"
                        />

                        <TextField
                            fullWidth
                            label="Price"
                            name="price"
                            type="number"
                            required
                            value={menuItem.price}
                            onChange={onChange}
                            className="modern-input"
                            InputProps={{ startAdornment: <span>$</span> }}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            name="description"
                            value={menuItem.description}
                            onChange={onChange}
                            className="modern-input"
                        />

                        <FormControl fullWidth className="modern-input">
                            <InputLabel>Category</InputLabel>
                            <Select
                                name="category"
                                value={menuItem.category}
                                onChange={onChange}
                                label="Category"
                            >
                                {categories.map(cat => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box className="toggle-box">
                            <Typography>Available for Order</Typography>
                            <Switch
                                checked={menuItem.isAvailable}
                                onChange={onChange}
                                name="isAvailable"
                                color="success"
                            />
                        </Box>

                        <TextField
                            fullWidth
                            label="Preparation Time (min)"
                            name="preparationTime"
                            type="number"
                            value={menuItem.preparationTime}
                            onChange={onChange}
                            className="modern-input"
                            InputProps={{ endAdornment: <AccessTime sx={{ color: '#888' }} /> }}
                        />

                                                {/* Customization Options */}
                        <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
                            <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                                Customization Options
                            </Typography>
                            
                            {/* Toppings */}
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2">Toppings</Typography>
                                    <IconButton size="small" onClick={() => handleAddOption('toppings')}>
                                        <AddCircleOutline />
                                    </IconButton>
                                </Box>
                                {menuItem.customization?.toppings.map((topping, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <TextField
                                            size="small"
                                            placeholder="Name (e.g., Extra Cheese)"
                                            value={topping.name}
                                            onChange={(e) => handleOptionChange('toppings', index, 'name', e.target.value)}
                                            sx={{ flex: 2 }}
                                        />
                                        <TextField
                                            size="small"
                                            type="number"
                                            placeholder="Price"
                                            value={topping.price}
                                            onChange={(e) => handleOptionChange('toppings', index, 'price', e.target.value)}
                                            sx={{ flex: 1 }}
                                            InputProps={{ startAdornment: <span>$</span> }}
                                        />
                                        <IconButton size="small" onClick={() => handleRemoveOption('toppings', index)}>
                                            <RemoveCircleOutline />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>

                            {/* Extras */}
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2">Extras</Typography>
                                    <IconButton size="small" onClick={() => handleAddOption('extras')}>
                                        <AddCircleOutline />
                                    </IconButton>
                                </Box>
                                {menuItem.customization?.extras.map((extra, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <TextField
                                            size="small"
                                            placeholder="Name (e.g., Double Meat)"
                                            value={extra.name}
                                            onChange={(e) => handleOptionChange('extras', index, 'name', e.target.value)}
                                            sx={{ flex: 2 }}
                                        />
                                        <TextField
                                            size="small"
                                            type="number"
                                            placeholder="Price"
                                            value={extra.price}
                                            onChange={(e) => handleOptionChange('extras', index, 'price', e.target.value)}
                                            sx={{ flex: 1 }}
                                            InputProps={{ startAdornment: <span>$</span> }}
                                        />
                                        <IconButton size="small" onClick={() => handleRemoveOption('extras', index)}>
                                            <RemoveCircleOutline />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>

                            {/* Sauces */}
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2">Sauces</Typography>
                                    <IconButton size="small" onClick={() => handleAddOption('sauces')}>
                                        <AddCircleOutline />
                                    </IconButton>
                                </Box>
                                {menuItem.customization?.sauces.map((sauce, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <TextField
                                            size="small"
                                            placeholder="Name (e.g., BBQ Sauce)"
                                            value={sauce.name}
                                            onChange={(e) => handleOptionChange('sauces', index, 'name', e.target.value)}
                                            sx={{ flex: 2 }}
                                        />
                                        <TextField
                                            size="small"
                                            type="number"
                                            placeholder="Price"
                                            value={sauce.price}
                                            onChange={(e) => handleOptionChange('sauces', index, 'price', e.target.value)}
                                            sx={{ flex: 1 }}
                                            InputProps={{ startAdornment: <span>$</span> }}
                                        />
                                        <IconButton size="small" onClick={() => handleRemoveOption('sauces', index)}>
                                            <RemoveCircleOutline />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>

                            {/* Sizes */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2">Sizes</Typography>
                                    <IconButton size="small" onClick={() => handleAddOption('sizes')}>
                                        <AddCircleOutline />
                                    </IconButton>
                                </Box>
                                {menuItem.customization?.sizes.map((size, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <TextField
                                            size="small"
                                            placeholder="Name (e.g., Large)"
                                            value={size.name}
                                            onChange={(e) => handleOptionChange('sizes', index, 'name', e.target.value)}
                                            sx={{ flex: 2 }}
                                        />
                                        <TextField
                                            size="small"
                                            type="number"
                                            placeholder="Price"
                                            value={size.price}
                                            onChange={(e) => handleOptionChange('sizes', index, 'price', e.target.value)}
                                            sx={{ flex: 1 }}
                                            InputProps={{ startAdornment: <span>$</span> }}
                                        />
                                        <IconButton size="small" onClick={() => handleRemoveOption('sizes', index)}>
                                            <RemoveCircleOutline />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        {/* Image Upload Section */}
                        <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="500">Menu Images</Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<CloudUpload />}
                                    onClick={() => fileInputRef.current?.click()}
                                    size="small"
                                >
                                    Upload Images
                                </Button>
                            </Box>
                            
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                hidden
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />

                            {(!menuItem.images || menuItem.images.length === 0) ? (
                                <Box 
                                    sx={{ 
                                        border: '2px dashed #ddd',
                                        borderRadius: '8px',
                                        p: 3,
                                        textAlign: 'center',
                                        bgcolor: '#fafafa'
                                    }}
                                >
                                    <Typography color="text.secondary">
                                        No images selected yet
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                        {menuItem.images.length} image(s) selected:
                                    </Typography>
                                    <Stack spacing={1}>
                                        {menuItem.images.map((img, idx) => (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    p: 1,
                                                    border: '1px solid #eee',
                                                    borderRadius: '4px',
                                                    bgcolor: '#fff'
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '4px',
                                                        overflow: 'hidden',
                                                        mr: 2,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <img
                                                        src={img.preview}
                                                        alt={`Preview ${idx + 1}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {img.file.name}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    sx={{ color: '#666' }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Box>
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions className="modern-actions" sx={{ p: 2, borderTop: '1px solid #ddd' }}>
                    <Button onClick={onClose} variant="outlined" className="modern-cancel">
                        Cancel
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default AddMenuDialog;